# 📚 SmartBrief - AI要約 & 翻訳SaaSプラットフォーム (v2.0)

![Java](https://img.shields.io/badge/Java_21-Spring_Boot_3-green)
![Go](https://img.shields.io/badge/Go_1.22-Search_Service-00ADD8)
![React](https://img.shields.io/badge/React-Vite-blue)
![Infrastructure](https://img.shields.io/badge/Infra-Docker_%7C_Cloudflare-orange)
![Security](https://img.shields.io/badge/Security-A%2B_Rating-success)

> **🚀 Project Status: v2.0 メジャーアップデート完了 (2026.01)**
>
> 本プロジェクトは、個人開発の枠を超え、**商用利用を前提としたSaaSプロダクト**として設計・開発・デプロイを完了しました。
> 従来のキーワード検索を刷新し、**Gemini AIとベクトルデータベースを統合した「AI感情検索」**を実装。技術選定から多言語マイクロサービス間の通信制御まで、モダンなアーキテクチャを完遂しています。

---

## 📖 プロダクト概要

**「名作を、10分で。今の気分を、一言で。」**

SmartBriefは、忙しい現代人のために、青空文庫や海外の名作文学をAIが読みやすく要約・翻訳して提供する「時短読書プラットフォーム」です。
v2.0では、**「切ない恋の話」「勇気が湧いてくる物語」**といった、ユーザーの感性に直接響く言葉で1.7万件の蔵書から最適な一冊を見つけ出す、新次元の検索体験を提供します。

### 🌐 Live Demo
採用担当者様向けに、全機能（翻訳・無制限アクセス）を開放したプレミアムアカウントをご用意しました。

**URL:** <https://smartbrief.jp/>

| プラン | ID / Email | Pass | 想定利用シーン |
| :--- | :--- | :--- | :--- |
| **💎 Premium** | Email: `guest.pre@example.com` | `Test@2025` | **AI感情検索・翻訳全文・高品質要約**を含むフル機能を体験いただけます。 |
| **🌱 Free** | Email: `guest.free@example.com` | `Test@2025` | 無料会員の制限（**1日10回制限**）や、課金への導線を確認できます。 |

---

## 💡 技術的ハイライト & システム設計

### 1. 🧠 Hybrid RAG: ローカルGPUとクラウドAIの融合
コストと速度を両立するため、RAG（検索拡張生成）の工程を最適化しました。
- **Local Embedding (Ollama)**: RTX 3070のGPUリソースを活用。`mxbai-embed-large`モデルを自前運用し、1.7万件の蔵書を**完全無料・プライバシー重視**でベクトル化。
- **高速推論 (Groq)**: 検索結果に基づく回答生成には、世界最速級の推論エンジン「Groq」を採用。思考のスピードでAI司書が回答します。
- **セマンティック検索**: 「勇気で試練を乗り越える」といった抽象的なクエリから、文脈を理解して『坊っちゃん』を導き出す高度な検索精度を実現。

### 2. 🏗️ マルチ言語マイクロサービス・アーキテクチャ
システム負荷の最適化と保守性の向上のため、役割に応じた言語選択（Polyglot）を行っています。
- **Go Search Microservice**: 計算資源の効率化と並列処理に長けた**Go言語**を採用し、AI処理・ベクトル計算専用の検索エンジンを独立。
- **Orchestration (Java)**: **Spring Boot 3 (WebFlux)** が認証・認可、MySQL連携、決済処理を統括。
- **n8n Content Factory**: n8n、Vertex AI、GPT-5 Nanoを組み合わせ、手動更新ゼロでコンテンツが増え続けるパイプラインを構築。

### 3. 🛡️ エンタープライズ水準のセキュリティ
- **Zero Trust Network**: Cloudflare Tunnelによりインバウンドポートを全閉鎖。DDoS攻撃やポートスキャンを物理的に無効化。
- **最高評価「A+」**: Qualys SSL Labsにて最高評価を獲得。HSTS、TLS 1.3、CSP等の高度なWebセキュリティを完備。
- **認証の王道化**: Spring Securityを標準方式（AuthenticationManager）へ刷新し、JWT認証フローの信頼性を大幅に向上。

---

## ✨ 主要機能

### 📱 読書体験 (Core Features)
- **AI感情検索リーダー**: 1.7万件からAIがレコメンド。雑誌のような美しいレイアウトで読書体験を提供。
- **シームレス翻訳**: アプリ内でVertex AIによる翻訳全文を閲覧可能。
- **マルチプラットフォーム**: WebとLINE IDを紐付け。作品名を送信するだけで要約を返すLINE Bot機能。

### 💳 サブスクリプション基盤 (SaaS Architecture)
- **Stripe完全連携**: 決済（Checkout）から解約・カード変更（Portal）まで実装。
- **Webhookによる即時反映**: 決済イベントを検知し、DB上の権限（Free ⇔ Premium）をリアルタイムに自動更新。

---

## 🛠 技術スタック

| カテゴリ | 技術・ツール | 選定理由 |
| :--- | :--- | :--- |
| **Backend** | **Java 21, Spring Boot 3** | WebFluxによるノンブロッキングI/Oと堅牢なセキュリティ統括。 |
| **Search (AI)** Go 1.22, Ollama, Groq | ローカルGPUによるベクトル化と、Groqによる超高速推論のハイブリッド構成。 |
| **Frontend** | **React 19, Vite** | React Router v7 を採用。コンポーネント指向による高度なUI管理。 |
| **Database** | **MySQL 8.0 / Qdrant** | 構造化データとベクトルデータのハイブリッド管理。 |
| **Infra** | **Docker, Cloudflare** | コンテナ化による可搬性とゼロトラストによる安全な公開。 |
| **Payment** | **Stripe API** | 堅牢かつ拡張性の高い決済基盤。 |

---

## 📐 System Architecture Diagram

```mermaid
graph TD
    User((User)) -->|HTTPS / Zero Trust| CF[Cloudflare Tunnel]
    CF --> FE[React Frontend]
    FE -->|REST API| BE[Spring Boot API]

    subgraph "Core Backend"
        BE <-->|Auth & Data| MySQL[(MySQL DB)]
        BE <-->|Subscription| Stripe[Stripe API]
    end

    subgraph "Hybrid AI Engine"
        direction TB
        BE -->|Request| Dify[Dify Orchestrator]
        Dify <-->|Inference (Llama3)| Groq[Groq Cloud API]
        
        subgraph "Local GPU Cluster (RTX 3070)"
            Dify -->|Tool Call| GO[Go Search Service]
            GO <-->|Embedding| Ollama[Ollama (mxbai-embed)]
            GO <-->|Vector Search| Qdrant[(Qdrant DB)]
        end
    end

    subgraph "Content Factory"
        n8n[n8n Workflow] -->|Batch Fetch| Gutenberg[Project Gutenberg]
        n8n -->|Store Content| MySQL
    end

    classDef container fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef external fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef local fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    
    class FE,BE,MySQL,n8n container
    class CF,Stripe,Groq,Dify,Gutenberg external
    class GO,Ollama,Qdrant local
```

## 🛠 Development Episodes (Behind the Scenes)

### 1. 異言語間通信における「型」の壁を突破
Java (Spring Boot) と Go、二つの異なる言語をマイクロサービスとして連携させる際、JSONのデコードエラーという壁に直面しました。

* **課題**: Go側のライブラリ仕様により、検索結果が「オブジェクト（`{...}`）」で返る場合と「配列（`[...]`）」で返る場合があり、型定義に厳格なJava側で頻繁にクラッシュが発生。
* **解決**: Jacksonの `ObjectMapper` を活用した**実行時パース判定ロジック**を独自実装。受信したJSONの先頭トークンを判別し、実行時に動的に型を切り替えることで、異言語間の不安定な通信を完全に克服しました。

### 2. インフラ構築とデータ消失危機の克服
Docker環境で複数コンテナを連携させる際、ネットワーク設計の不備によりn8nのボリュームマウントが外れるインシデントが発生しました。

* **課題**: コンテナ間の名前解決ができず、無理にネットワーク設定を変更した結果、n8nのボリュームマウントが外れ、ワークフローデータが初期化されかける事態に。
* **解決**: AIに頼らず、公式ドキュメントに基づきDocker Network（Bridge）の仕様を再確認。コンテナログを1つずつ追跡し、正しいボリュームの再アタッチとセキュアな内部通信網を自分の手で完遂しました。

### 3. 1.7万件のベクトルインデックス構築
膨大な蔵書をAIに「意味」として理解させるため、全作品のベクトル化パイプラインをゼロから構築しました。

* **課題**: 1.7万件におよぶテキストデータをGemini APIで処理する際、APIのレートリミット（リクエスト制限）と膨大な計算時間がボトルネックに。
* **解決**: 
    * **バッチ処理設計**: 指数関数的バックオフ（Exponential Backoff）を取り入れた非同期処理を実装。
    * **Qdrantへの最適化**: ベクトル化された高次元データを高速にアップロードする一括投入パイプラインを完遂。文学的な「ニュアンス」をコンピュータが扱える数値へと昇華させました。

---

## 🚀 今後の展望
- **音声読み上げ機能**: Azure AI Speech等のAPIを用いたオーディオブック化。
- **AI要約パーソナライズ**: ユーザーの好みに合わせた「要約のトーン」の変更機能。
- **コミュニティ機能**: 感想を共有し、AIが似た感性のユーザーを繋ぐSNS機能。