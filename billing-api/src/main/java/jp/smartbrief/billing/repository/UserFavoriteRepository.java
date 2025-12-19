package jp.smartbrief.billing.repository;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import jp.smartbrief.billing.domain.UserFavorite;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * ユーザーお気に入りリポジトリ
 * 
 * UserFavorite エンティティに対するデータベース操作を行う
 * リアクティブリポジトリです。
 * お気に入りの登録、削除、検索などのクエリを提供します。
 */
public interface UserFavoriteRepository extends ReactiveCrudRepository<UserFavorite, Long> {
    
    // 特定ユーザーのお気に入り一覧 (登録が新しい順)
    @Query("SELECT * FROM user_favorites WHERE user_id = :userId ORDER BY created_at DESC")
    Flux<UserFavorite> findByUserIdOrderByCreatedAtDesc(Long userId);

    // 既に登録済みかチェック
    Mono<Boolean> existsByUserIdAndBookId(Long userId, Integer bookId);
    
    // 削除 (お気に入り解除)
    Mono<Void> deleteByUserIdAndBookId(Long userId, Integer bookId);
}