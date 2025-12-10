package com.example.demo.repository;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import com.example.demo.domain.UserFavorite;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface UserFavoriteRepository extends ReactiveCrudRepository<UserFavorite, Long> {
    
    // 特定ユーザーのお気に入り一覧 (登録が新しい順)
    @Query("SELECT * FROM user_favorites WHERE user_id = :userId ORDER BY created_at DESC")
    Flux<UserFavorite> findByUserIdOrderByCreatedAtDesc(Long userId);

    // 既に登録済みかチェック
    Mono<Boolean> existsByUserIdAndBookId(Long userId, Integer bookId);
    
    // 削除 (お気に入り解除)
    Mono<Void> deleteByUserIdAndBookId(Long userId, Integer bookId);
}