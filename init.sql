-- ==========================================
-- 1. データベースとユーザーの作成 (フェーズ1対応: 権限絞り込み)
-- ==========================================

-- データベース作成
CREATE DATABASE IF NOT EXISTS smartbrief_user_db;
CREATE DATABASE IF NOT EXISTS aozora_db;

-- ユーザー作成 & 権限付与
-- ★修正: ALL PRIVILEGES ではなく、アプリに必要な操作だけに絞っています
GRANT SELECT, INSERT, UPDATE, DELETE ON smartbrief_user_db.* TO 'smartbrief_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON aozora_db.* TO 'smartbrief_app'@'%';

FLUSH PRIVILEGES;

-- ==========================================
-- 2. ユーザー管理DB (smartbrief_user_db) のテーブル作成
-- ==========================================
USE smartbrief_user_db;

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    
    -- 権限・プラン
    roles VARCHAR(255) NOT NULL DEFAULT 'ROLE_USER',
    plan_type VARCHAR(50) NOT NULL DEFAULT 'FREE',
    
    -- 外部連携ID
    line_user_id VARCHAR(255) UNIQUE DEFAULT NULL,
    stripe_customer_id VARCHAR(255) DEFAULT NULL,
    
    -- パスワードリセット用
    reset_password_token VARCHAR(255) DEFAULT NULL,
    reset_password_expires_at DATETIME DEFAULT NULL,
    
    -- メール認証用
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255) DEFAULT NULL,
    
    -- 期間・作成日
    subscription_expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 閲覧履歴テーブル
CREATE TABLE IF NOT EXISTS user_book_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id INT NOT NULL,
    book_title VARCHAR(255),
    author_name VARCHAR(255),
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_view_date (user_id, viewed_at)
);

-- お気に入りテーブル
CREATE TABLE IF NOT EXISTS user_favorites (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id INT NOT NULL,
    book_title VARCHAR(255),
    author_name VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_book (user_id, book_id)
);

-- ==========================================
-- 3. 青空文庫DB (aozora_db) のテーブル作成
-- ==========================================
USE aozora_db;

-- 作品テーブル
CREATE TABLE IF NOT EXISTS works (
    work_id INT PRIMARY KEY,
    title VARCHAR(255),
    author_name VARCHAR(255),
    aozora_url VARCHAR(255),
    
    -- 作品詳細・要約
    catchphrase VARCHAR(255),
    insight TEXT,
    summary_300 TEXT,
    summary_hq TEXT,
    is_hq BOOLEAN DEFAULT FALSE,
    genre_tag VARCHAR(255),

    -- 画像と翻訳用のカラム
    image_url VARCHAR(255),
    category VARCHAR(50),
    original_title VARCHAR(255),
    summary_short TEXT,
    summary_long TEXT,
    body_text LONGTEXT,
    
    full_text LONGTEXT
);