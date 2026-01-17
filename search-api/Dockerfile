# ビルドステージ
FROM golang:1.24-alpine AS builder
WORKDIR /app

# 先に go.mod だけコピー
COPY go.mod ./

# 依存関係のファイルをコピー（もしあれば）
# COPY go.sum ./

# ソースコードをコピー
COPY . .

# ★ここがポイント: ビルド時に依存関係を整理・ダウンロードさせる
RUN go mod tidy
RUN go build -o main .

# 実行ステージ
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/main .
EXPOSE 8081
CMD ["./main"]