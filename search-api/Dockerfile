# ビルドステージ
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod ./
# COPY go.sum ./ # まだ依存がないのでコメントアウト
# RUN go mod download
COPY . .
RUN go build -o main .

# 実行ステージ (軽量なAlpineを使用)
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/main .
EXPOSE 8081
CMD ["./main"]