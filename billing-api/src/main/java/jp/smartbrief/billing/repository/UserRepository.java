package jp.smartbrief.billing.repository;

import org.springframework.data.r2dbc.repository.Query; // ★これが必要です
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

import jp.smartbrief.billing.domain.User;

import reactor.core.publisher.Mono;

/**
 * ユーザーリポジトリ
 * 
 * User エンティティに対するデータベース操作を行う
 * リアクティブリポジトリです。
 * ユーザー検索（名前、メール、LINE ID など）や認証情報の取得などの
 * クエリを提供します。
 */
@Repository
public interface UserRepository extends ReactiveCrudRepository<User, Long> {
    
    // 1. ユーザー名での検索（既存）
    Mono<User> findByUsername(String username);

    // 2. LINE ID での検索（既存）
    Mono<User> findByLineUserId(String lineUserId);
    
    // 3. ★追加: メールアドレスでの検索 (登録時の重複チェック用)
    Mono<User> findByEmail(String email);

    // 4. ★追加: ログイン用 (ID または メール で検索)
    // ユーザーが入力した文字列が username か email のどちらかに一致すればOK
    @Query("SELECT * FROM users WHERE username = :input OR email = :input")
    Mono<User> findByUsernameOrEmail(String input);
    
    // ★★★ 追加: リセットトークンでユーザーを検索 ★★★
    Mono<User> findByResetPasswordToken(String resetPasswordToken);
    
    // ★追加
    Mono<User> findByVerificationToken(String verificationToken);
}