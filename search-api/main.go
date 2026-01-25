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

// ==========================================
// 1. 設定定数 & グローバル変数
// ==========================================
const (
	CollectionName = "works_vector_local"
	VectorSize     = 1024
	MaxEmbedLength = 400
	MinTextLength  = 100
)

// 共通DB接続プール
var db *sql.DB

// ==========================================
// 2. 構造体定義 (DTO)
// ==========================================

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
			Content string `json:"message"`
		} `json:"message"`
	} `json:"choices"`
}

// Ollama API用 (最新の /api/embed 仕様)
type OllamaEmbedRequest struct {
	Model string   `json:"model"`
	Input []string `json:"input"`
}

type OllamaEmbedResponse struct {
	Embeddings [][]float32 `json:"embeddings"`
}

// ==========================================
// 3. ヘルパー関数
// ==========================================

func safeGetString(payload map[string]*pb.Value, key string) (string, bool) {
	val, exists := payload[key]
	if !exists || val == nil {
		return "", false
	}
	return val.GetStringValue(), true
}

func getOllamaHost() string {
	host := os.Getenv("OLLAMA_HOST")
	if host == "" {
		return "ollama"
	}
	return host
}

func cleanBody(body string) string {
	reRuby := regexp.MustCompile(`《.*?》|［＃.*?］`)
	return strings.TrimSpace(reRuby.ReplaceAllString(body, ""))
}

// ==========================================
// 4. 外部API連携 (AI処理)
// ==========================================

// [修正版] タイムアウトを120秒に延長し、最新エンドポイントに対応
func getEmbedding(ctx context.Context, text string) ([]float32, error) {
	runes := []rune(text)
	if len(runes) > MaxEmbedLength {
		text = string(runes[:MaxEmbedLength])
	}

	reqBody := OllamaEmbedRequest{
		Model: "mxbai-embed-large",
		Input: []string{text},
	}

	jsonPayload, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("JSON marshal failed: %w", err)
	}

	// エンドポイントは最新の /api/embed
	endpoint := fmt.Sprintf("http://%s:11434/api/embed", getOllamaHost())

	req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewReader(jsonPayload))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	// ★ 重要: タイムアウトを 120秒に延長 (モデルのロード待ち対策)
	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("Ollama connection failed (timeout?): %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Ollama returned error status: %d", resp.StatusCode)
	}

	var response OllamaEmbedResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("Ollama JSON decode failed: %w", err)
	}

	if len(response.Embeddings) == 0 {
		return nil, fmt.Errorf("Ollama returned empty embeddings")
	}

	return response.Embeddings[0], nil
}

func generateReasonWithGroq(ctx context.Context, query, title, author, preview string) string {
	groqKey := os.Getenv("GROQ_API_KEY")
	if groqKey == "" {
		return ""
	}

	reqBody := GroqRequest{
		Model: "llama-3.1-8b-instant",
		Messages: []GroqMessage{
			{Role: "system", Content: "あなたは優秀なブックアドバイザーです。ユーザーの検索意図に対して、マッチする理由を40文字以内で推薦してください。"},
			{Role: "user", Content: fmt.Sprintf("検索意図: %s\n作品名: %s\n著者: %s\nあらすじ: %s", query, title, author, preview)},
		},
	}
	jsonPayload, _ := json.Marshal(reqBody)

	req, _ := http.NewRequestWithContext(ctx, "POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewReader(jsonPayload))
	req.Header.Set("Authorization", "Bearer "+groqKey)
	req.Header.Set("Content-Type", "application/json")

	// ... generateReasonWithGroq 関数内 ...
	client := &http.Client{Timeout: 10 * time.Second} // 3秒だとGroqが混んでいる時に切れるので10秒に
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("❌ Groq API Error: %v", err) // エラーをログに出す
		return ""
	}
	defer resp.Body.Close()

	var groqResp GroqResponse
	json.NewDecoder(resp.Body).Decode(&groqResp)

	if len(groqResp.Choices) > 0 {
		return strings.TrimSpace(groqResp.Choices[0].Message.Content)
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

// ==========================================
// 5. メインプロセス
// ==========================================

func main() {
	dsn := os.Getenv("MYSQL_DSN")
	var err error
	db, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("❌ DB Connection failed: %v", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		log.Fatalf("❌ DB Ping failed: %v", err)
	}
	log.Println("✅ Database connection pool initialized")
	defer db.Close()

	// 1. Setup Collection
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
			fmt.Fprintln(w, "✅ Collection created!")
		}
	})

	// 2. Indexing (修正箇所: 各ループのタイムアウトを大幅延長)
	http.HandleFunc("/index", func(w http.ResponseWriter, r *http.Request) {
		go func() {
			log.Println("🚀 Fast Indexing started...")
			_, conn, err := newQdrantClient()
			if err != nil {
				return
			}
			defer conn.Close()
			pClient := pb.NewPointsClient(conn)

			lastId := 0
			limit := 1000
			for {
				rows, err := db.Query("SELECT work_id, title, author_name, full_text FROM works WHERE full_text IS NOT NULL AND CHAR_LENGTH(full_text) > ? AND work_id > ? ORDER BY work_id ASC LIMIT ?", MinTextLength, lastId, limit)
				if err != nil {
					log.Printf("Query error: %v", err)
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

						// ★ 修正: 5秒制限だとGPU/VRAMロード中に落ちるため、120秒に変更
						eCtx, eCancel := context.WithTimeout(context.Background(), 120*time.Second)
						vec, err := getEmbedding(eCtx, title+" "+cleaned)
						eCancel()

						if err != nil {
							log.Printf("⚠️ Vectorization skipped for ID %d: %v", id, err)
							continue
						}

						pClient.Upsert(context.Background(), &pb.UpsertPoints{
							CollectionName: CollectionName,
							Points: []*pb.PointStruct{{
								Id:      &pb.PointId{PointIdOptions: &pb.PointId_Num{Num: uint64(id)}},
								Vectors: &pb.Vectors{VectorsOptions: &pb.Vectors_Vector{Vector: &pb.Vector{Data: vec}}},
								Payload: map[string]*pb.Value{
									"title":   {Kind: &pb.Value_StringValue{StringValue: title}},
									"author":  {Kind: &pb.Value_StringValue{StringValue: author}},
									"preview": {Kind: &pb.Value_StringValue{StringValue: strings.Join(strings.Fields(cleaned), "")[:200]}},
								},
							}},
						})
						batchCount++
					}
				}
				rows.Close()
				if batchCount == 0 {
					break
				}
				lastId = maxIdInBatch
			}
			log.Println("🎉 Fast Indexing Complete!")
		}()
		fmt.Fprintln(w, "Fast indexing started.")
	})

	// 3. Search
	http.HandleFunc("/search", func(w http.ResponseWriter, r *http.Request) {
		rawQuery := r.URL.Query().Get("q")
		if rawQuery == "" {
			http.Error(w, "Query parameter 'q' is required", 400)
			return
		}

		// ★ 検索時のベクトル化も120秒に延長 (安全のため)
		ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
		defer cancel()

		vec, err := getEmbedding(ctx, rawQuery)
		if err != nil {
			http.Error(w, "Embedding failed", 500)
			return
		}

		_, conn, _ := newQdrantClient()
		defer conn.Close()
		pClient := pb.NewPointsClient(conn)

		res, _ := pClient.Search(ctx, &pb.SearchPoints{
			CollectionName: CollectionName,
			Vector:         vec,
			Limit:          10,
			WithPayload:    &pb.WithPayloadSelector{SelectorOptions: &pb.WithPayloadSelector_Enable{Enable: true}},
		})

		var results []RichSearchHit
		var wg sync.WaitGroup
		var mu sync.Mutex

		for _, hit := range res.Result {
			payload := hit.Payload
			title, tOk := safeGetString(payload, "title")
			author, aOk := safeGetString(payload, "author")
			preview, pOk := safeGetString(payload, "preview")

			if !tOk || !aOk || !pOk {
				continue
			}

			hitData := RichSearchHit{
				ID: hit.Id.GetNum(), Score: hit.Score, Title: title, Author: author,
			}

			idx := len(results)
			results = append(results, hitData)

			wg.Add(1)
			go func(idx int, t, a, p string) {
				defer wg.Done()
				gCtx, gCancel := context.WithTimeout(context.Background(), 5*time.Second)
				defer gCancel()
				reason := generateReasonWithGroq(gCtx, rawQuery, t, a, p)
				mu.Lock()
				results[idx].AIReason = reason
				mu.Unlock()
			}(idx, title, author, preview)
		}
		wg.Wait()

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(results)
	})

	log.Println("🚀 Local Search API running on :8081 (Ollama Embed API Ready)")
	http.ListenAndServe(":8081", nil)
}
