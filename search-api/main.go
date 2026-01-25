package main

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"

	_ "github.com/go-sql-driver/mysql"
	pb "github.com/qdrant/go-client/qdrant"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// --- 設定定数 ---
const (
	CollectionName = "works_vector_local"
	VectorSize     = 1024
	MaxEmbedLength = 400
	MinTextLength  = 100
)

var db *sql.DB

// --- Data Transfer Objects (DTO) ---

type RichSearchHit struct {
	ID       uint64  `json:"id"`
	Score    float32 `json:"score"`
	Title    string  `json:"title"`
	Author   string  `json:"author"`
	AIReason string  `json:"aiReason"`
}

type GroqRequest struct {
	Model    string        `json:"model"`
	Messages []GroqMessage `json:"messages"`
}

type GroqMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type GroqResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

type OllamaEmbedRequest struct {
	Model string   `json:"model"`
	Input []string `json:"input"`
}

type OllamaEmbedResponse struct {
	Embeddings [][]float32 `json:"embeddings"`
}

// --- Helper Functions ---

func safeGetString(payload map[string]*pb.Value, key string) string {
	if val, exists := payload[key]; exists && val != nil {
		return val.GetStringValue()
	}
	return ""
}

func getOllamaHost() string {
	if host := os.Getenv("OLLAMA_HOST"); host != "" {
		return host
	}
	return "ollama"
}

func cleanBody(body string) string {
	re := regexp.MustCompile(`《.*?》|［＃.*?］`)
	return strings.TrimSpace(re.ReplaceAllString(body, ""))
}

// --- AI Service logic ---

// getEmbedding はテキストをベクトル化します
func getEmbedding(ctx context.Context, text string) ([]float32, error) {
	runes := []rune(text)
	if len(runes) > MaxEmbedLength {
		text = string(runes[:MaxEmbedLength])
	}

	reqBody := OllamaEmbedRequest{Model: "mxbai-embed-large", Input: []string{text}}
	payload, _ := json.Marshal(reqBody)

	url := fmt.Sprintf("http://%s:11434/api/embed", getOllamaHost())
	req, _ := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ollama error: %d", resp.StatusCode)
	}

	var res OllamaEmbedResponse
	json.NewDecoder(resp.Body).Decode(&res)
	if len(res.Embeddings) == 0 {
		return nil, fmt.Errorf("empty embeddings")
	}
	return res.Embeddings[0], nil
}

// generateReasonWithGroq はAIによる推薦理由を生成します
func generateReasonWithGroq(ctx context.Context, query, title, author, preview string) string {
	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		return ""
	}

	reqBody := GroqRequest{
		Model: "llama-3.1-8b-instant",
		Messages: []GroqMessage{
			{Role: "system", Content: "あなたは優秀なブックアドバイザーです。ユーザーの検索意図に対して、マッチする理由を40文字以内で推薦してください。"},
			{Role: "user", Content: fmt.Sprintf("意図:%s\n作品:%s\n著者:%s\n内容:%s", query, title, author, preview)},
		},
	}
	payload, _ := json.Marshal(reqBody)

	req, _ := http.NewRequestWithContext(ctx, "POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewReader(payload))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("⚠️ Groq connection failed: %v", err)
		return ""
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return ""
	}

	var res GroqResponse
	json.NewDecoder(resp.Body).Decode(&res)
	if len(res.Choices) > 0 {
		return strings.TrimSpace(res.Choices[0].Message.Content)
	}
	return ""
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

// --- Main HTTP Handlers ---

func main() {
	var err error
	db, err = sql.Open("mysql", os.Getenv("MYSQL_DSN"))
	if err != nil {
		log.Fatalf("❌ DB connection failed: %v", err)
	}
	db.SetMaxOpenConns(25)

	log.Println("✅ Search API starting on :8081")

	// コレクション初期化
	http.HandleFunc("/setup", func(w http.ResponseWriter, r *http.Request) {
		_, conn, err := newQdrantClient()
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		defer conn.Close()
		client := pb.NewCollectionsClient(conn)
		client.Create(context.Background(), &pb.CreateCollection{
			CollectionName: CollectionName,
			VectorsConfig: &pb.VectorsConfig{
				Config: &pb.VectorsConfig_Params{
					Params: &pb.VectorParams{Size: VectorSize, Distance: pb.Distance_Cosine},
				},
			},
		})
		fmt.Fprintln(w, "Setup complete")
	})

	// インデクシング実行
	http.HandleFunc("/index", func(w http.ResponseWriter, r *http.Request) {
		go func() {
			log.Println("🚀 Indexing started...")
			_, conn, _ := newQdrantClient()
			defer conn.Close()
			pClient := pb.NewPointsClient(conn)
			lastId := 0
			for {
				rows, _ := db.Query("SELECT work_id, title, author_name, full_text FROM works WHERE full_text IS NOT NULL AND CHAR_LENGTH(full_text) > ? AND work_id > ? ORDER BY work_id ASC LIMIT 100", MinTextLength, lastId)
				count := 0
				for rows.Next() {
					var id int
					var t, a, b string
					rows.Scan(&id, &t, &a, &b)
					lastId = id
					count++

					vec, err := getEmbedding(context.Background(), t+" "+cleanBody(b))
					if err != nil {
						continue
					}
					pClient.Upsert(context.Background(), &pb.UpsertPoints{
						CollectionName: CollectionName,
						Points: []*pb.PointStruct{{
							Id:      &pb.PointId{PointIdOptions: &pb.PointId_Num{Num: uint64(id)}},
							Vectors: &pb.Vectors{VectorsOptions: &pb.Vectors_Vector{Vector: &pb.Vector{Data: vec}}},
							Payload: map[string]*pb.Value{
								"title":   {Kind: &pb.Value_StringValue{StringValue: t}},
								"author":  {Kind: &pb.Value_StringValue{StringValue: a}},
								"preview": {Kind: &pb.Value_StringValue{StringValue: strings.Join(strings.Fields(cleanBody(b)), "")[:200]}},
							},
						}},
					})
				}
				rows.Close()
				if count == 0 {
					break
				}
			}
			log.Println("🎉 Indexing finished")
		}()
		fmt.Fprintln(w, "Indexing triggered")
	})

	// 検索エンドポイント
	http.HandleFunc("/search", func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query().Get("q")
		if query == "" {
			http.Error(w, "query required", 400)
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
		defer cancel()

		vec, err := getEmbedding(ctx, query)
		if err != nil {
			log.Printf("❌ Embedding error: %v", err)
			http.Error(w, "internal error", 500)
			return
		}

		_, conn, _ := newQdrantClient()
		defer conn.Close()
		pClient := pb.NewPointsClient(conn)

		res, err := pClient.Search(ctx, &pb.SearchPoints{
			CollectionName: CollectionName,
			Vector:         vec,
			Limit:          10,
			WithPayload:    &pb.WithPayloadSelector{SelectorOptions: &pb.WithPayloadSelector_Enable{Enable: true}},
		})
		if err != nil {
			http.Error(w, "search failed", 500)
			return
		}

		results := make([]RichSearchHit, 0)
		var mu sync.Mutex
		var wg sync.WaitGroup

		for i, hit := range res.Result {
			title := safeGetString(hit.Payload, "title")
			author := safeGetString(hit.Payload, "author")
			preview := safeGetString(hit.Payload, "preview")

			results = append(results, RichSearchHit{
				ID: hit.Id.GetNum(), Score: hit.Score, Title: title, Author: author,
			})

			wg.Add(1)
			go func(idx int, t, a, p string) {
				defer wg.Done()
				time.Sleep(time.Duration(idx*150) * time.Millisecond) // Rate limiting

				gCtx, gCancel := context.WithTimeout(context.Background(), 15*time.Second)
				defer gCancel()

				reason := generateReasonWithGroq(gCtx, query, t, a, p)

				mu.Lock()
				results[idx].AIReason = reason
				mu.Unlock()
			}(i, title, author, preview)
		}
		wg.Wait()

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(results)
	})

	http.ListenAndServe(":8081", nil)
}
