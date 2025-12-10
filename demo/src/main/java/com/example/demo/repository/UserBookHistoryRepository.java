package com.example.demo.repository;

import java.time.LocalDateTime;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import com.example.demo.domain.UserBookHistory;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface UserBookHistoryRepository extends ReactiveCrudRepository<UserBookHistory, Long> {

    // 既存のメソッド
    Mono<Long> countByUserIdAndViewedAtAfter(Long userId, LocalDateTime viewedAt);

    // ★追加: 閲覧数ランキング（トップ10の book_id を返す）
    // book_id ごとにグループ化してカウントし、多い順に並べる
    @Query("SELECT book_id FROM user_book_history GROUP BY book_id ORDER BY COUNT(book_id) DESC LIMIT 10")
    Flux<Integer> findTopBookIds();
    
    // ★追加: 特定ユーザーの閲覧履歴を新しい順に取得 (LIMIT 10)
    // R2DBCなので @Query で書くのが確実です
    @Query("SELECT * FROM user_book_history WHERE user_id = :userId ORDER BY viewed_at DESC LIMIT 10")
    Flux<UserBookHistory> findHistoryByUserId(Long userId);
}