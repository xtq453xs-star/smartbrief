# 1. ビルド用コンテナ
FROM gradle:8.5-jdk17 AS builder
WORKDIR /app
COPY . .
RUN gradle build -x test --no-daemon

# 2. 実行用コンテナ (軽量なJava環境)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar

# ポート公開
EXPOSE 8080

# 起動コマンド
ENTRYPOINT ["java", "-jar", "app.jar"]