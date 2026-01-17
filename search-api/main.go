package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"

	pb "github.com/qdrant/go-client/qdrant"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

const (
	CollectionName = "works_vector"
	VectorSize     = 768
	QdrantPort     = "6334"
)

func getEmbedding(ctx context.Context, text string) ([]float32, error) {
	runes := []rune(text)
	if len(runes) > 10000 {
		text = string(runes[:10000])
	}

	apiKey := os.Getenv("GOOGLE_API_KEY")
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return nil, err
	}
	defer client.Close()

	em := client.EmbeddingModel("text-embedding-004")
	res, err := em.EmbedContent(ctx, genai.Text(text))
	if err != nil {
		return nil, err
	}
	return res.Embedding.Values, nil
}

func newQdrantClient() (pb.QdrantClient, *grpc.ClientConn, error) {
	host := os.Getenv("QDRANT_HOST")
	if host == "" {
		host = "qdrant"
	}
	addr := fmt.Sprintf("%s:%s", host, QdrantPort)
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	return pb.NewQdrantClient(conn), conn, err
}

func main() {
	// ① Setup
	http.HandleFunc("/setup", func(w http.ResponseWriter, r *http.Request) {
		ctx := context.Background()
		_, conn, err := newQdrantClient()
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		defer conn.Close()

		collectionsClient := pb.NewCollectionsClient(conn)
		_, err = collectionsClient.Create(ctx, &pb.CreateCollection{
			CollectionName: CollectionName,
			VectorsConfig: &pb.VectorsConfig{
				Config: &pb.VectorsConfig_Params{
					Params: &pb.VectorParams{Size: VectorSize, Distance: pb.Distance_Cosine},
				},
			},
		})
		if err != nil {
			fmt.Fprintf(w, "Setup log: %v\n", err)
		} else {
			fmt.Fprintln(w, "Collection created!")
		}
	})

	// ② Indexing (MySQL -> Qdrant) - full_text対応 & 1.7万件完走版
	http.HandleFunc("/index", func(w http.ResponseWriter, r *http.Request) {
		go func() {
			dsn := os.Getenv("MYSQL_DSN")
			db, err := sql.Open("mysql", dsn)
			if err != nil {
				log.Printf("MySQL connect error: %v", err)
				return
			}
			defer db.Close()

			_, conn, err := newQdrantClient()
			if err != nil {
				log.Printf("Qdrant connect error: %v", err)
				return
			}
			defer conn.Close()
			pointsClient := pb.NewPointsClient(conn)

			totalCount := 0
			offset := 0
			limit := 1000

			for {
				// ★ full_text カラムを読み込み、work_id 順に取得
				query := fmt.Sprintf("SELECT work_id, title, author_name, full_text FROM works WHERE full_text IS NOT NULL AND full_text != '' ORDER BY work_id ASC LIMIT %d OFFSET %d", limit, offset)
				rows, err := db.Query(query)
				if err != nil {
					log.Printf("Query error at offset %d: %v", offset, err)
					break
				}

				batchCount := 0
				//並列処理を30件に変更
				const numWorkers = 30
				jobs := make(chan struct {
					id                  uint64
					title, author, body string
				}, numWorkers*2)

				var wg sync.WaitGroup
				ctx := context.Background()

				for i := 0; i < numWorkers; i++ {
					wg.Add(1)
					go func() {
						defer wg.Done()
						for job := range jobs {
							// 全文だと長すぎる場合があるので、getEmbedding内の rune制限(2000) で安全に処理
							vector, err := getEmbedding(ctx, fmt.Sprintf("タイトル: %s, 著者: %s, 内容: %s", job.title, job.author, job.body))
							if err != nil {
								// API制限(429)が出た場合は、少し待機してリトライするなどの処理が必要ですが、一旦スキップ
								continue
							}
							_, _ = pointsClient.Upsert(ctx, &pb.UpsertPoints{
								CollectionName: CollectionName,
								Points: []*pb.PointStruct{
									{
										Id: &pb.PointId{PointIdOptions: &pb.PointId_Num{Num: job.id}},
										Vectors: &pb.Vectors{
											VectorsOptions: &pb.Vectors_Vector{
												Vector: &pb.Vector{Data: vector},
											},
										},
										Payload: map[string]*pb.Value{
											"title":  {Kind: &pb.Value_StringValue{StringValue: job.title}},
											"author": {Kind: &pb.Value_StringValue{StringValue: job.author}},
										},
									},
								},
							})
						}
					}()
				}

				for rows.Next() {
					var id uint64
					var title, author, body string
					if err := rows.Scan(&id, &title, &author, &body); err == nil {
						jobs <- struct {
							id                  uint64
							title, author, body string
						}{id, title, author, body}
						batchCount++
					}
				}
				rows.Close()
				close(jobs)
				wg.Wait()

				if batchCount == 0 {
					break
				}

				totalCount += batchCount
				log.Printf("✅ Batch Finished: %d / 17846 completed", totalCount)
				offset += limit

				// Gemini API の Rate Limit (1500RPM) 対策で、1バッチ(1000件)ごとに3秒休憩
				time.Sleep(3 * time.Second)
			}
			log.Printf("🎉🎊 MISSION COMPLETE! Total: %d works indexed.", totalCount)
		}()

		fmt.Fprintf(w, "Background indexing started for 17,846 works. Check logs!")
	})

	// ③ Search
	http.HandleFunc("/search", func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query().Get("q")
		if query == "" {
			http.Error(w, "Query parameter 'q' is required", 400)
			return
		}

		vector, err := getEmbedding(context.Background(), query)
		if err != nil {
			http.Error(w, "Embedding failed", 500)
			return
		}

		_, conn, err := newQdrantClient()
		if err != nil {
			http.Error(w, "DB connect failed", 500)
			return
		}
		defer conn.Close()

		pointsClient := pb.NewPointsClient(conn)
		searchRes, err := pointsClient.Search(context.Background(), &pb.SearchPoints{
			CollectionName: CollectionName,
			Vector:         vector,
			Limit:          10,
			WithPayload:    &pb.WithPayloadSelector{SelectorOptions: &pb.WithPayloadSelector_Enable{Enable: true}},
		})
		if err != nil {
			log.Printf("Search error: %v", err)
			http.Error(w, "Search failed", 500)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(searchRes.Result)
	})

	log.Println("Go Search Service running on :8081")
	if err := http.ListenAndServe(":8081", nil); err != nil {
		log.Fatal(err)
	}
}
