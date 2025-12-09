# 1. ベースイメージ（軽量なNode.js）
FROM node:22-alpine

# 2. 作業ディレクトリ
WORKDIR /app

# 3. 依存関係ファイルと設定ファイルを先にコピー（キャッシュ効率のため）
COPY package*.json ./
COPY vite.config.js ./

# 4. 依存関係をインストール
RUN npm install

# 5. ソースコードを全コピー
COPY . .

# 6. Viteのデフォルトポート
EXPOSE 5173

# 7. HMRを安定させる環境変数を設定
ENV CHOKIDAR_USEPOLLING=true

# 8. 起動コマンド
CMD ["npm", "run", "dev", "--", "--host"]