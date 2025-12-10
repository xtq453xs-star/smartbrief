package com.example.demo.repository;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import com.example.demo.domain.Work;

import reactor.core.publisher.Flux;

public interface WorkRepository extends ReactiveCrudRepository<Work, Integer> {

    // 通常検索 (部分一致)
    // ★修正: aozora_db.works と明示する
    @Query("SELECT * FROM aozora_db.works WHERE title LIKE :keyword OR author_name LIKE :keyword LIMIT 20")
    Flux<Work> searchByKeyword(String keyword);

    // サジェスト検索 (前方一致)
    // ★修正: aozora_db.works と明示する
    @Query("SELECT * FROM aozora_db.works WHERE title LIKE :keyword OR author_name LIKE :keyword LIMIT 10")
    Flux<Work> suggestByKeyword(String keyword);
    // ★追加: 作家一覧を取得 (作品数が多い順にトップ20)
    // GROUP BY で作家をまとめ、COUNT で数を数えて並べ替えます
    @Query("SELECT author_name FROM works GROUP BY author_name ORDER BY COUNT(*) DESC LIMIT 20")
    Flux<String> findTopAuthors();
    // ★追加: 全作家リスト取得 (作品数が多い順)
    @Query("SELECT author_name FROM works GROUP BY author_name ORDER BY COUNT(*) DESC")
    Flux<String> findAllAuthors();
    // ★追加: 特定のジャンルを含む作品を検索 (部分一致)
    @Query("SELECT * FROM works WHERE genre_tag LIKE :genre LIMIT 20")
    Flux<Work> findByGenreTagContaining(String genre);

    // ★追加: すべてのジャンルタグを取得 (あとでJava側で分解・整理します)
    @Query("SELECT genre_tag FROM works WHERE genre_tag IS NOT NULL")
    Flux<String> findAllGenreTags();
}