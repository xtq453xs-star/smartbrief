package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	_ "github.com/go-sql-driver/mysql"

	pb "github.com/qdrant/go-client/qdrant"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// 設定定数
const (
	CollectionName = "works_vector_local"
	VectorSize     = 1024
	MaxEmbedLength = 400
	MinTextLength  = 100
)

// ★修正1: 環境変数からOllamaのURLを取得する関数
func getOllamaEndpoint() string {
	host := os.Getenv("OLLAMA_HOST")
	if host == "" {
		host = "host.docker.internal"
	}
	return fmt.Sprintf("http://%s:11434/api/embeddings", host)
}

func getEmbedding(ctx context.Context, text string) ([]float32, error) {
	runes := []rune(text)
	if len(runes) > MaxEmbedLength {
		text = string(runes[:MaxEmbedLength])
	}

	type OllamaRequest struct {
		Model  string `json:"model"`
		Prompt string `json:"prompt"`
	}

	reqBody := OllamaRequest{Model: "mxbai-embed-large", Prompt: text}
	jsonPayload, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	client := &http.Client{Timeout: 30 * time.Second}
	// ★修正1: ハードコードを排除
	resp, err := client.Post(getOllamaEndpoint(), "application/json", strings.NewReader(string(jsonPayload)))
	if err != nil {
		return nil, fmt.Errorf("Ollama connection failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("Ollama returned status: %d", resp.StatusCode)
	}

	var response struct {
		Embedding []float32 `json:"embedding"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("Ollama decode error: %v", err)
	}

	return response.Embedding, nil
}

func cleanBody(body string) string {
	const separator = "-------------------------------------------------------"
	if strings.Contains(body, separator) {
		parts := strings.Split(body, separator)
		body = parts[len(parts)-1]
	}
	reHeader := regexp.MustCompile(`(?s)【テキスト中に現れる記号について】.*?(\n\n|$)`)
	body = reHeader.ReplaceAllString(body, "")
	reRuby := regexp.MustCompile(`《.*?》|［＃.*?］`)
	body = reRuby.ReplaceAllString(body, "")
	body = strings.ReplaceAll(body, "-", "")
	body = strings.ReplaceAll(body, "─", "")
	body = strings.ReplaceAll(body, "\r", "")
	return strings.TrimSpace(body)
}

func safeSubtitle(text string, length int) string {
	runes := []rune(text)
	if len(runes) <= length {
		return text
	}
	return string(runes[:length])
}

func newQdrantClient() (pb.QdrantClient, *grpc.ClientConn, error) {
	host := os.Getenv("QDRANT_HOST")
	if host == "" {
		host = "qdrant"
	}
	addr := fmt.Sprintf("%s:6334", host)
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	return pb.NewQdrantClient(conn), conn, err
}

func main() {
	http.HandleFunc("/setup", func(w http.ResponseWriter, r *http.Request) {
		ctx := context.Background()
		_, conn, err := newQdrantClient()
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		defer conn.Close()
		client := pb.NewCollectionsClient(conn)
		_, err = client.Create(ctx, &pb.CreateCollection{
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

	http.HandleFunc("/index", func(w http.ResponseWriter, r *http.Request) {
		go func() {
			log.Println("🚀 Fast Indexing started...")
			dsn := os.Getenv("MYSQL_DSN")
			db, err := sql.Open("mysql", dsn)
			if err != nil {
				return
			}
			defer db.Close()
			_, conn, err := newQdrantClient()
			if err != nil {
				return
			}
			defer conn.Close()
			pClient := pb.NewPointsClient(conn)

			// ★修正2: OFFSETを廃止し、lastIdを使った高速ページネーションに変更
			lastId := 0
			limit := 1000
			for {
				query := fmt.Sprintf("SELECT work_id, title, author_name, full_text FROM works WHERE full_text IS NOT NULL AND CHAR_LENGTH(full_text) > %d AND work_id > %d ORDER BY work_id ASC LIMIT %d", MinTextLength, lastId, limit)
				rows, err := db.Query(query)
				if err != nil {
					break
				}

				batchCount := 0
				var maxIdInBatch int

				for rows.Next() {
					var id int
					var title, author, body string
					if err := rows.Scan(&id, &title, &author, &body); err == nil {
						maxIdInBatch = id
						cleaned := cleanBody(body)
						inputText := fmt.Sprintf("%s %s %s\n%s", title, title, title, cleaned)

						vec, err := getEmbedding(context.Background(), inputText)
						if err != nil {
							log.Printf("Skip ID %d: %v", id, err)
							continue
						}

						_, _ = pClient.Upsert(context.Background(), &pb.UpsertPoints{
							CollectionName: CollectionName,
							Points: []*pb.PointStruct{{
								Id:      &pb.PointId{PointIdOptions: &pb.PointId_Num{Num: uint64(id)}},
								Vectors: &pb.Vectors{VectorsOptions: &pb.Vectors_Vector{Vector: &pb.Vector{Data: vec}}},
								Payload: map[string]*pb.Value{
									"title":   {Kind: &pb.Value_StringValue{StringValue: title}},
									"author":  {Kind: &pb.Value_StringValue{StringValue: author}},
									"preview": {Kind: &pb.Value_StringValue{StringValue: safeSubtitle(cleaned, 200)}},
								},
							}},
						})
						batchCount++
						if id%100 == 0 {
							log.Printf("Processing ID: %d", id)
						}
					}
				}
				rows.Close()
				if batchCount == 0 {
					break
				}
				// 次のループの開始位置を更新
				lastId = maxIdInBatch
			}
			log.Println("🎉 Fast Indexing Complete!")
		}()
		fmt.Fprintln(w, "Fast indexing started.")
	})

	http.HandleFunc("/search", func(w http.ResponseWriter, r *http.Request) {
		rawQuery := r.URL.Query().Get("q")
		if rawQuery == "" {
			return
		}

		log.Printf("🔍 Query: %s", rawQuery)
		vec, err := getEmbedding(context.Background(), rawQuery)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}

		_, conn, err := newQdrantClient()
		if err != nil {
			return
		}
		defer conn.Close()
		pClient := pb.NewPointsClient(conn)

		res, err := pClient.Search(context.Background(), &pb.SearchPoints{
			CollectionName: CollectionName,
			Vector:         vec,
			Limit:          10,
			WithPayload:    &pb.WithPayloadSelector{SelectorOptions: &pb.WithPayloadSelector_Enable{Enable: true}},
		})
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(res.Result)
	})

	log.Println("Local Search API running on :8081")
	http.ListenAndServe(":8081", nil)
}
