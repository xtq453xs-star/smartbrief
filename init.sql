-- 既存のユーザーDB（もしなければ作成）
CREATE DATABASE IF NOT EXISTS smartbrief_user_db;

-- ★今回追加する青空文庫DB
CREATE DATABASE IF NOT EXISTS aozora_db;

-- ユーザーに両方のDBへの権限を与える
-- ※ 'smartbrief_app' は .env の BILLING_DB_USER と一致させる
GRANT ALL PRIVILEGES ON smartbrief_user_db.* TO 'smartbrief_app'@'%';
GRANT ALL PRIVILEGES ON aozora_db.* TO 'smartbrief_app'@'%';

FLUSH PRIVILEGES;