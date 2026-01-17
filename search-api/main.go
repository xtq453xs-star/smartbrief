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
	OllamaEndpoint = "http://host.docker.internal:11434/api/embeddings"
	MaxEmbedLength = 400 // Ollama用に短く制限
	MinTextLength  = 100
)

// getEmbedding: ローカルのOllamaを叩く
func getEmbedding(ctx context.Context, text string) ([]float32, error) {
	// 1. 文字数カット
	runes := []rune(text)
	if len(runes) > MaxEmbedLength {
		text = string(runes[:MaxEmbedLength])
	}

	// 2. リクエストの作成
	type OllamaRequest struct {
		Model  string `json:"model"`
		Prompt string `json:"prompt"`
	}

	reqBody := OllamaRequest{
		Model:  "mxbai-embed-large",
		Prompt: text,
	}

	jsonPayload, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	// 3. Ollamaへ送信
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Post(OllamaEndpoint, "application/json", strings.NewReader(string(jsonPayload)))
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
	// ① Setup
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
			fmt.Fprintln(w, "Collection created (Simple Mode)!")
		}
	})

	// ② Indexing: シンプル化
	http.HandleFunc("/index", func(w http.ResponseWriter, r *http.Request) {
		go func() {
			log.Println("🚀 Simple Indexing started...")
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

			offset := 0
			limit := 1000
			for {
				query := fmt.Sprintf("SELECT work_id, title, author_name, full_text FROM works WHERE full_text IS NOT NULL AND CHAR_LENGTH(full_text) > %d ORDER BY work_id ASC LIMIT %d OFFSET %d", MinTextLength, limit, offset)
				rows, err := db.Query(query)
				if err != nil {
					break
				}

				batchCount := 0
				for rows.Next() {
					var id uint64
					var title, author, body string
					if err := rows.Scan(&id, &title, &author, &body); err == nil {
						cleaned := cleanBody(body)

						// ★ここをシンプル化★
						// タイトルと本文を改行でつなぐだけ。ラベル（作品名:など）は削除。
						// これで「羅生門」と検索した時に、先頭のタイトルに強く反応するはず。
						inputText := fmt.Sprintf("%s %s %s\n%s", title, title, title, cleaned)

						vec, err := getEmbedding(context.Background(), inputText)
						if err != nil {
							log.Printf("Skip ID %d: %v", id, err)
							continue
						}

						_, _ = pClient.Upsert(context.Background(), &pb.UpsertPoints{
							CollectionName: CollectionName,
							Points: []*pb.PointStruct{{
								Id:      &pb.PointId{PointIdOptions: &pb.PointId_Num{Num: id}},
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
				offset += limit
			}
			log.Println("🎉 Simple Indexing Complete!")
		}()
		fmt.Fprintln(w, "Simple indexing started.")
	})

	// ③ Search: シンプル化
	http.HandleFunc("/search", func(w http.ResponseWriter, r *http.Request) {
		rawQuery := r.URL.Query().Get("q")
		if rawQuery == "" {
			return
		}

		// ★ここもシンプル化★
		// 検索クエリをそのまま投げる（タイトル検索も本文検索もよしなに拾わせる）
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
