package com.example.demo.repository;

import java.time.LocalDateTime;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import com.example.demo.domain.UserBookHistory;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface UserBookHistoryRepository extends ReactiveCrudRepository<UserBookHistory, Long> {
    
    // ★重要: 指定した日時（今日の0時）以降に、このユーザーが見た回数を数える
    Mono<Long> countByUserIdAndViewedAtAfter(Long userId, LocalDateTime date);

    // ユーザーごとの履歴一覧を取得（新しい順）
    // ※ダッシュボードで「最近読んだ本」を表示する時に使います
    Flux<UserBookHistory> findByUserIdOrderByViewedAtDesc(Long userId);
    
    // ★追加: 閲覧数が多い順に book_id を5件取得
    @Query("SELECT book_id FROM user_book_history GROUP BY book_id ORDER BY COUNT(id) DESC LIMIT 5")
    Flux<Long> findTopBookIds();
}