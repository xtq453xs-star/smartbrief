# SmartBrief System Architecture (Public Overview)

Version: 1.0  

※このドキュメントは、外部公開用の技術概要です。IPアドレスや具体的な設定値など、内部運用情報は意図的に省略しています。

---

## 1. サービス概要

SmartBrief は、青空文庫の作品を対象にした **AI要約プラットフォーム** です。

- 古典文学を「約10分で読める」分量に要約
- 検索・ランキング・お気に入り等の閲覧機能
- 無料／有料のサブスクリプションモデル（Stripe連携）
- Webアプリ＋LINEボット連携によるマルチチャネル提供

アプリケーション全体は Docker Compose を用いてコンテナ化されており、  
フロントエンド・バックエンド・データベース・バッチ基盤を分離したマイクロサービス構成になっています。

---

## 2. システム構成（High-level Architecture）

### 2.1 コンポーネント一覧

**Frontend**

- React + Vite
- 認証／検索／閲覧などの Web UI

**Backend API**

- Java 17 / Spring Boot 3 (WebFlux)
- 認証・権限管理（無料／プレミアム）、作品閲覧制御
- Stripe Webhook 連携・LINE連携・履歴管理 等

**Database**

- MySQL 8.x（Dockerコンテナ）
- ユーザー情報、作品メタデータ、要約、閲覧履歴、お気に入り情報 等を永続化

**Automation / Integration**

- n8n（ワークフローオーケストレーション）
- 青空文庫の収集・AI要約バッチ
- メール送信、LINE Bot との連携 等

**Network / Edge**

- Docker Compose によるアプリケーションネットワーク
- Cloudflare Tunnel を利用した安全な外部公開  
  （サーバ側で直接ポート開放を行わない構成）

### 2.2 アーキテクチャ図（概略）

graph TD
    %% ユーザーからのアクセスフロー
    User((User)) -->|Browser| FE[React Frontend]
    User -->|LINE App| LINE[LINE Bot]
    
    FE -->|REST API / JWT| BE[Spring Boot API]
    
    %% LINE連携
    LINE -->|Webhook| n8n_bot["n8n (LINE Handler)"]
    n8n_bot -->|REST API| BE
    
    %% アプリケーションコア
    subgraph "Application Core (Docker)"
        BE -->|Async Query / R2DBC| DB[("MySQL DB")]
        BE -->|Subscription Status| Stripe[Stripe API]
        BE -->|Email Request| n8n_mail["n8n (Email Service)"]
    end
    
    %% 裏側のデータパイプライン
    subgraph "Data Pipeline (n8n)"
        n8n_batch[n8n Batch] -->|1. Fetch & Clean| Aozora[青空文庫 Web]
        n8n_batch -->|2. Summarize| OpenAI[OpenAI API]
        n8n_batch -->|3. Store Data| DB
    end

    classDef container fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef external fill:#fff3e0,stroke:#ff6f00,stroke-width:2px;
    class FE,BE,n8n_bot,n8n_mail,n8n_batch,DB container;
    class User,Stripe,Aozora,OpenAI,LINE external;
## 3. Backend Design（Java / Spring WebFlux）

### 3.1 認証・認可

**方式**

- JWT（JSON Web Token）によるステートレス認証

**主な設計ポイント**

- `Authorization: Bearer <token>` ヘッダを検証
- ユーザー種別（`FREE` / `PREMIUM`）に応じたアクセス制御
- 以下をフレームワーク（ルーティング／セキュリティ設定）で明確に分離
  - 認証不要パス（ログイン、サインアップ、パスワードリセット、各種 Webhook）
  - 認証必須パス（作品閲覧・履歴／お気に入り取得など）

---

### 3.2 データモデル（概要）

主なエンティティは以下の通りです（カラム名・テーブル名は一部抽象化）。

- **User**
  - 認証情報（メールアドレス、パスワードハッシュ など）
  - 会員種別（`FREE` / `PREMIUM`）
  - サブスクリプションステータス

- **Work**
  - 作品ID、タイトル、著者名
  - 要約テキスト（複数段階の長さ・バージョン）

- **UserBookHistory**
  - ユーザーごとの作品閲覧履歴
  - 日次カウントによる「無料枠の閲覧制限」判定に利用

- **UserFavorite**
  - ユーザーのお気に入り作品の管理

実装には **Spring Data R2DBC** を用いており、  
リアクティブな I/O パターンを採用することで、同時接続へのスケーラビリティを意識した設計としています。

---

### 3.3 外部連携

- **Stripe**
  - サブスクリプションの購入／更新／解約イベントを Webhook で受信
  - イベント種別に応じてユーザーの会員ステータスを更新

- **LINE**
  - n8n 経由の Webhook で、ユーザーアカウントとの紐付けを実施
  - LINE 経由での閲覧時に、課金状況や無料枠を含む閲覧権限チェックを行う

- **n8n**
  - バッチ処理・メール送信・通知などのトリガーを API 経由で連携
  - Backend とは Webhook / REST API ベースで疎結合に統合

---

## 4. Frontend Design（React / Vite）

- 使用ライブラリ:
  - React
  - Vite
  - `react-router-dom`

**主な画面**

- 非ログインユーザー向け:
  - `/login`
  - `/forgot-password`
  - `/reset-password`
- ログインユーザー向け:
  - `/`（ダッシュボード）
  - 検索画面
  - 作品詳細画面 など

**状態管理・ルーティング**

- ブラウザの `localStorage` に保存されたトークンでログイン状態を判定
- フロント側でルートガードを実装し、ログイン必須ページへの直接アクセスを制御

**UX 面の工夫**

- ダッシュボード初期表示時に複数の API を **並列呼び出し** することで、
  - ステータス
  - 閲覧履歴
  - ランキング
  - お気に入り  
  をまとめて取得し、初回ロード時間の短縮を図っています。

---

## 5. Automation Pipeline（n8n）

SmartBrief では、作品の要約生成やデータ更新を **事前バッチ処理** として行っています。

### 5.1 主なワークフロー

1. 青空文庫からの作品情報／本文の取得
2. テキスト整形（タグ除去・正規化など）
3. OpenAI API を用いた要約生成
4. DB への保存・更新
5. 必要に応じたメール通知・LINE通知

### 5.2 設計方針

- ユーザーアクセス時に毎回生成するのではなく、  
  **事前に要約を生成・保存** しておくことでレスポンス速度を安定化
- n8n とバックエンド間は **Webhook / REST API** で疎結合に連携し、
  - ワークフロー側の変更がアプリケーションコアに影響しにくい構成とする

---

## 6. Security & Operations（概要）

- APIキーや DB 接続情報、JWT シークレットなどの機密情報は  
  **すべて環境変数で管理** し、リポジトリにはコミットしない
- 認証不要エンドポイントと認証必須エンドポイントを  
  フレームワーク（Spring Security 等）の設定で明確に分離
- Cloudflare などのエッジ側で HTTPS 終端・保護を行いつつ、  
  アプリケーション層でもステータスコード・例外ハンドリングを実装
- コンテナオーケストレーションには **Docker Compose** を利用し、
  更新時は
  - イメージ再ビルド
  - 環境変数の適用  
  による運用を行う

---

このドキュメントは、SmartBrief の「技術的な全体像」を外部向けに説明するためのものです。  
より詳細な運用マニュアルや具体的な設定値は、非公開の内部ドキュメント側で管理しています。