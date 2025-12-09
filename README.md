* **堅牢なセキュリティ**:
    * 環境変数の徹底管理（`.env`運用）により、APIキーやDBパスワードの流出を防止。
    * **Spring Security** と **JWT (JSON Web Token)** を用いたステートレスな認証システムを構築。
* **実用的なSaaSモデルの実装**:
    * **Stripe** 決済を完全統合し、サブスクリプションの購入・解約・有効期限管理を自動化。
    * 「無料会員は1日3冊まで」「プレミアム会員は無制限」というビジネスロジックをバックエンドで厳密に制御。
* **UX/UIの追求**:
    * **サジェスト機能付き検索**: 大量の作品データからストレスなく目的の本を探せる検索体験。
    * **雑誌風リーダー**: 「しっぽり明朝」などのフォントを使い分け、AI要約を文芸誌のように美しく表示する専用UI。

## 🛠 使用技術

### Frontend
* **Library**: React (Vite)
* **Styling**: CSS Modules (Grid Layout / Responsive)
* **Payment**: Stripe.js

### Backend & Database
* **Language**: Java 17
* **Framework**: Spring Boot 3.x (Spring WebFlux)
* **Security**: Spring Security, JWT
* **ORM**: Spring Data R2DBC (Reactive Relational Database Connectivity)
* **Database**: MySQL 8.0

### AI & Data Pipeline
* **Orchestrator**: n8n (Workflow Automation)
* **AI Model**: OpenAI API (GPT-4o mini)
* **Process**: 青空文庫スクレイピング → テキスト正規化 → AI要約 → DB保存

### Infrastructure
* **Container**: Docker / Docker Compose
* **Network**: Cloudflare Tunnel (外部公開用)

## 📐 アーキテクチャ図

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
