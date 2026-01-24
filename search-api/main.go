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

// 設定定数
const (
	CollectionName = "works_vector_local"
	VectorSize     = 1024
	MaxEmbedLength = 400
	MinTextLength  = 100
)

// ★追加1: レスポンス用の構造体を定義（Java側が受け取る型）
type RichSearchHit struct {
	ID       uint64  `json:"id"`
	Score    float32 `json:"score"`
	Title    string  `json:"title"`
	Author   string  `json:"author"`
	AIReason string  `json:"aiReason"` // Groqが生成する理由
}

// Groq APIの構造体
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
	resp, err := client.Post(getOllamaEndpoint(), "application/json", bytes.NewReader(jsonPayload))
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

// ★追加2: Groqを使って推薦理由を生成する関数
func generateReasonWithGroq(ctx context.Context, query, title, author, preview string) string {
	groqKey := os.Getenv("GROQ_API_KEY")
	if groqKey == "" {
		log.Println("GROQ_API_KEY is not set")
		return ""
	}

	// プロンプト設計: 極めて短く、感情に訴えかけるように指示する
	systemPrompt := "あなたは優秀なブックアドバイザーです。ユーザーの検索意図に対して、なぜこの本がマッチするのかを「40文字以内」で、情景が浮かぶような魅力的な言葉で推薦してください。作品名や著者名は繰り返さなくて良いです。"
	userPrompt := fmt.Sprintf("検索意図: %s\n作品名: %s\n著者: %s\nあらすじ: %s", query, title, author, preview)

	reqBody := GroqRequest{
		Model: "llama-3.1-8b-instant",
		Messages: []GroqMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
	}
	jsonPayload, _ := json.Marshal(reqBody)

	// APIリクエスト
	req, _ := http.NewRequestWithContext(ctx, "POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewReader(jsonPayload))
	req.Header.Set("Authorization", "Bearer "+groqKey)
	req.Header.Set("Content-Type", "application/json")

	// タイムアウトを短く設定（Groqが遅い場合にUXを犠牲にしないため）
	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Groq API error: %v", err)
		return ""
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		log.Printf("Groq returned status: %d", resp.StatusCode)
		return ""
	}

	var groqResp GroqResponse
	if err := json.NewDecoder(resp.Body).Decode(&groqResp); err != nil {
		return ""
	}

	if len(groqResp.Choices) > 0 {
		return strings.TrimSpace(groqResp.Choices[0].Message.Content)
	}
	return ""
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
		// (変更なし、省略せずそのまま配置)
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
		// (変更なし、省略せずそのまま配置)
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

	// ★修正3: /search の大幅アップデート（Goroutineの導入）
	http.HandleFunc("/search", func(w http.ResponseWriter, r *http.Request) {
		rawQuery := r.URL.Query().Get("q")
		if rawQuery == "" {
			http.Error(w, "Query parameter 'q' is required", http.StatusBadRequest)
			return
		}

		log.Printf("🔍 Query: %s", rawQuery)

		// 1. クエリをベクトル化
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		vec, err := getEmbedding(ctx, rawQuery)
		if err != nil {
			http.Error(w, "Vectorization failed: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// 2. Qdrantを検索
		_, conn, err := newQdrantClient()
		if err != nil {
			http.Error(w, "Qdrant connection failed", http.StatusInternalServerError)
			return
		}
		defer conn.Close()
		pClient := pb.NewPointsClient(conn)

		res, err := pClient.Search(ctx, &pb.SearchPoints{
			CollectionName: CollectionName,
			Vector:         vec,
			Limit:          10,
			WithPayload:    &pb.WithPayloadSelector{SelectorOptions: &pb.WithPayloadSelector_Enable{Enable: true}},
		})
		if err != nil {
			http.Error(w, "Qdrant search failed: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// 3. 検索結果を整形し、Groqで理由を並列生成
		results := make([]RichSearchHit, len(res.Result))
		var wg sync.WaitGroup

		for i, hit := range res.Result {
			// Qdrantからのデータ抽出
			id := hit.Id.GetNum()
			payload := hit.Payload
			title := payload["title"].GetStringValue()
			author := payload["author"].GetStringValue()
			preview := payload["preview"].GetStringValue()

			results[i] = RichSearchHit{
				ID:     id,
				Score:  hit.Score,
				Title:  title,
				Author: author,
			}

			// Goroutineを使って並列でGroq APIを叩く
			wg.Add(1)
			go func(idx int, t, a, p string) {
				defer wg.Done()
				// 各リクエストごとに新しいコンテキスト（タイムアウト付）を作成
				gCtx, gCancel := context.WithTimeout(context.Background(), 3*time.Second)
				defer gCancel()

				reason := generateReasonWithGroq(gCtx, rawQuery, t, a, p)
				results[idx].AIReason = reason
			}(i, title, author, preview)
		}

		// 全てのAI生成が完了するのを待つ（最大3秒）
		wg.Wait()

		// 4. JSONとして返却
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(results)
	})

	log.Println("Local Search API running on :8081")
	http.ListenAndServe(":8081", nil)
}
