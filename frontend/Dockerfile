# --- Stage 1: Build ---
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Stage 2: Production ---
FROM nginx:stable-alpine
# ビルド済みファイルのコピー
COPY --from=builder /app/dist /usr/share/nginx/html
# 外部化した本番用Nginx設定のコピー
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]