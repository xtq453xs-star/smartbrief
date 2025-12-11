# SmartBrief (青空文庫 AI要約プラットフォーム)

> **Note**  
> ※本プロジェクトは、個人での商用化を目指して設計・開発・運用を行っているSaaSプロダクトです。  
> **【2025/12 リリース済】** 認証基盤、決済、LINE連携を含む全機能が稼働中です。

---

## 📖 どんなサービス？

**「名作を、10分で。」**  
SmartBriefは、忙しい現代人のために、青空文庫の名作文学をAIが読みやすく要約して提供する**「時短読書プラットフォーム」**です。

膨大な数の作品の中から、今の気分に合った本を瞬時に検索し、雑誌のような美しいレイアウトで要約を楽しむことができます。  
また、**LINE公式アカウントとも完全連動**しており、スマホから手軽に読書体験が可能です。

### ✅ このプロジェクトで技術的に示せること

- **自動化と最適化**: n8nで「収集 → 整形 → AI要約 → DB格納」のパイプラインを構築し、運用負荷の低減とAPIコストの最適化を実現。
- **セキュアな設計**: JWT認証、環境変数による機密情報の分離、Cloudflare Tunnelを用いたポート開放なしの安全な公開運用。
- **SaaS運用**: Stripeサブスクリプションと連携し、決済状態（無料 / プレミアム）に基づいた権限管理と解約フローを完全自動化。
- **マルチプラットフォーム**: WebアプリとLINEボットのユーザー情報を紐付け、プラットフォームを跨いだシームレスな会員体験を提供。

### 🌐 ライブデモ

実際に稼働しているサービスをご覧いただけます。  
**URL:** <https://smartbrief.jp/>  
*(※決済機能はテストモードで安全に動作確認が可能です)*

---

## ✨ 主な機能と特徴

### 1. 読書体験を変える「AI要約 & 雑誌風UI」

単なるテキストの羅列ではなく、**「しっぽり明朝」**フォントや余白を活かした**雑誌風のデザイン**を採用。  
AI（**GPT-5 Nano**）が生成した高品質な要約により、難解な古典文学も短時間で理解できます。

### 2. 自分だけの図書館「マイ・ライブラリ」

- **閲覧履歴・お気に入り:** 読んだ本や気に入った本を自動で記録し、ダッシュボードで管理できます。
- **多様な検索:** タイトル検索だけでなく、「人気ランキング」「作家一覧」「ジャンル検索」など、多角的なアプローチで本と出会えます。

### 3. 本格的な「サブスクリプション & アカウント管理」

商用利用を想定した堅牢な会員システムを実装しています。

- **認証:** ID / パスワードに加え、**メールアドレス認証**と**セキュアなパスワードリセット機能**を完備。
- **権限管理:** 無料会員（1日3冊制限）とプレミアム会員（無制限）の厳密な出し分け。
- **決済連携:** Stripeカスタマーポータルと連携し、ユーザー自身での解約・カード変更が可能。

### 4. LINEボット連携

Web版の機能をLINEでも利用可能です。

- **アカウント連携:** Webの会員情報とLINE IDを紐付け、課金ステータスを同期。
- **トークで読書:** 作品名を送るだけで、AI要約がトーク画面に届きます。

---

## 📸 画面イメージ

| トップページ（ダッシュボード） | 詳細ページ（要約リーダー） |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/5e33c07d-1c07-4df2-90ec-e99d48cb73c6" width="800" alt="トップページ" /> | <img src="https://github.com/user-attachments/assets/2dc648a1-52d6-421f-bf75-73c8e662a00f" width="800" alt="詳細ページ" /> |

---

## 👨‍💻 エンジニア向け技術解説 (Architecture)

### 🔥 こだわりのアーキテクチャ

#### 事前生成型データパイプライン (n8n)

- ユーザーのリクエスト毎にAI生成するのではなく、裏側で **n8n (ローコードツール)** が自動で作品を収集・要約・DB格納を行っています。
- これにより、ユーザーへのレスポンスを**高速化**し、都度生成によるAPIコストを**最適化**しています。

#### 完全非同期のバックエンド (Spring WebFlux)

- Java の最新フレームワーク **Spring Boot 3 (WebFlux)** と **R2DBC** を採用。
- I/O待ちが多いAPI処理においてもスレッドをブロックしにくい構成とし、リソース効率と応答性能を意識した設計を行いました。

#### 堅牢なセキュリティと運用設計

- **JWT (JSON Web Token)** を用いたステートレス認証。
- **Cloudflare Tunnel** を使用し、自宅サーバー等の環境でもインバウンドポートを開放せずに安全に外部公開。
- **メール配信基盤:** Javaからn8nのWebhookを呼び出し、Gmail API (OAuth2) 経由でメールを配信するマイクロサービス的な疎結合構成を採用。

---

## 🛠 使用技術スタック

| カテゴリ | 技術・ツール |
| :--- | :--- |
| **Frontend** | React, Vite, CSS Modules, React Router |
| **Backend** | Java 17, Spring Boot 3 (WebFlux), Spring Security |
| **Database** | MySQL 8.0 (Docker Container, Multi-Schema) |
| **Infra** | Docker, Docker Compose, Cloudflare Tunnel |
| **AI / Batch** | n8n, OpenAI API (GPT-5 Nano) |
| **Payment** | Stripe API (Checkout & Portal) |
| **Messaging** | LINE Messaging API |

---

## 📐 システム構成図

```mermaid
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
        BE -->|Async Query / R2DBC| MySQL[("MySQL DB")]
        BE -->|Subscription Status| Stripe[Stripe API]
        BE -->|Email Request| n8n_mail["n8n (Email Service)"]
    end
    
    %% 裏側のデータパイプライン
    subgraph "Data Pipeline (n8n)"
        n8n_batch[n8n Batch] -->|1. Fetch & Clean| Aozora[青空文庫 Web]
        n8n_batch -->|2. Summarize| OpenAI[OpenAI API]
        n8n_batch -->|3. Store Data| MySQL
    end

    classDef container fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef external fill:#fff3e0,stroke:#ff6f00,stroke-width:2px;
    class FE,BE,n8n_bot,n8n_mail,n8n_batch,MySQL container;
    class User,Stripe,Aozora,OpenAI,LINE external;
    
🧩 詳細なシステムアーキテクチャ
より詳しい構成や設計ポリシーについては、下記ドキュメントをご覧ください。