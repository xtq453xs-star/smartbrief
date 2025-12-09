# SmartBrief (青空文庫 AI要約プラットフォーム)

## 📖 どんなサービス？
**「名作を、10分で。」**
SmartBriefは、忙しい現代人のために、青空文庫の名作文学をAIが読みやすく要約して提供する**「時短読書プラットフォーム」**です。

膨大な数の作品の中から、今の気分に合った本を瞬時に検索し、雑誌のような美しいレイアウトで要約を楽しむことができます。

### 🌐 ライブデモ
実際に稼働しているサービスをご覧いただけます。
**URL:** [https://smartbrief.jp/](https://smartbrief.jp/)
*(※決済機能はテストモードで安全に動作確認が可能です)*

---

## ✨ 主な機能と特徴

### 1. 読書体験を変える「AI要約 & 雑誌風UI」
単なるテキストの羅列ではなく、**「しっぽり明朝」**フォントや余白を活かした**雑誌風のデザイン**を採用。
AI（GPT-4o mini）が生成した高品質な要約により、難解な古典文学も短時間で理解できます。

### 2. サクサク動く「サジェスト検索」
タイトルや作家名を入力すると、リアルタイムで候補が表示される**オートコンプリート機能**を搭載。
膨大なデータベースから、ストレスなく目的の作品にたどり着けます。

### 3. 本格的な「サブスクリプション機能」
SaaSビジネスモデルを実装しています。
* **無料会員:** 1日3冊までの閲覧制限。
* **プレミアム会員:** 月額1,000円で無制限に読み放題 + 高品質(HQ)要約へのアクセス権。
*(Stripe決済と連携し、支払いが完了すると即座に機能制限が解除されます)*

## 📸 画面イメージ
| トップページ（ランキング） | 詳細ページ（要約リーダー） |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/5e33c07d-1c07-4df2-90ec-e99d48cb73c6" width="800" alt="トップページ" /> | <img src="https://github.com/user-attachments/assets/2dc648a1-52d6-421f-bf75-73c8e662a00f" width="800" alt="詳細ページ" /> |

---

## 👨‍💻 エンジニア向け技術解説 (Architecture)

ここからは、本サービスを支える技術的な裏側について解説します。
**「フルスタック開発」「非同期処理」「インフラ構築」**のスキルセットを投じて構築しました。

### 🔥 こだわりのアーキテクチャ
* **事前生成型データパイプライン (n8n)**
    * ユーザーがアクセスするたびにAI生成するのではなく、裏側で **n8n (ローコードツール)** が自動で作品を収集・要約・DB格納を行っています。
    * これにより、ユーザーへのレスポンス速度を爆速にし、APIコストも最小限に抑えています。
* **完全非同期のバックエンド (Spring WebFlux)**
    * Javaの最新フレームワーク **Spring Boot 3 (WebFlux)** と **R2DBC** を採用。
    * 大量のアクセスがあってもスレッドをブロックしない、高パフォーマンスなAPIを構築しました。
* **堅牢なセキュリティ設計**
    * **JWT (JSON Web Token)** を用いたステートレス認証。
    * パスワードやAPIキーは環境変数 (`.env`) で厳格に管理し、コードには一切含めていません。
    * ネットワークは **Cloudflare Tunnel** を使用し、ポート開放を行わずに安全に外部公開しています。

### 🛠 使用技術スタック

| カテゴリ | 技術・ツール |
| :--- | :--- |
| **Frontend** | React, Vite, CSS Modules |
| **Backend** | Java 17, Spring Boot 3 (WebFlux), Spring Security |
| **Database** | MySQL 8.0 (Docker Container) |
| **Infra** | Docker, Docker Compose, Cloudflare Tunnel |
| **AI / Batch** | n8n, OpenAI API (GPT-4o mini) |
| **Payment** | Stripe API |

### 📐 システム構成図

```mermaid
graph TD
    %% ユーザーからのアクセスフロー
    User((User)) -->|Browser| FE[React Frontend]
    FE -->|REST API / JWT| BE[Spring Boot API]
    
    subgraph "Application Core (Docker)"
        BE -->|Async Query / R2DBC| MySQL[(MySQL DB)]
        BE -->|Subscription Status| Stripe[Stripe API]
    end
    
    %% 裏側のデータパイプライン
    subgraph "Data Pipeline (n8n)"
        n8n[n8n Automation] -->|1. Fetch & Clean| Aozora[青空文庫 Web]
        n8n -->|2. Summarize| OpenAI[OpenAI API]
        n8n -->|3. Store Data| MySQL
    end

    classDef container fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef external fill:#fff3e0,stroke:#ff6f00,stroke-width:2px;
    class FE,BE,n8n,MySQL container;
    class User,Stripe,Aozora,OpenAI external;