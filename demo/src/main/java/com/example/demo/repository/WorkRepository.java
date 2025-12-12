package com.example.demo.repository;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import com.example.demo.domain.Work;

import reactor.core.publisher.Flux;

public interface WorkRepository extends ReactiveCrudRepository<Work, Integer> {

    // 通常検索 (部分一致)
    // ★修正: LIMIT 20 を LIMIT :limit に変更し、引数に int limit を追加
    @Query("SELECT * FROM aozora_db.works WHERE title LIKE :keyword OR author_name LIKE :keyword LIMIT :limit")
    Flux<Work> searchByKeyword(String keyword, int limit);

    // サジェスト検索 (前方一致)
    // ※サジェストは軽量なままでいいので、ここは LIMIT 10 のままでもOKですが、
    // もし増やしたいなら同様に変更してください。一旦そのままにしておきます。
    @Query("SELECT * FROM aozora_db.works WHERE title LIKE :keyword OR author_name LIKE :keyword LIMIT 10")
    Flux<Work> suggestByKeyword(String keyword);

    // ★追加: 作家一覧 (変更なし)
    @Query("SELECT author_name FROM works GROUP BY author_name ORDER BY COUNT(*) DESC LIMIT 20")
    Flux<String> findTopAuthors();

    // ★追加: 全作家リスト (変更なし)
    @Query("SELECT author_name FROM works GROUP BY author_name ORDER BY COUNT(*) DESC")
    Flux<String> findAllAuthors();

    // ★追加: ジャンル検索
    // ★修正: ここも LIMIT 20 を LIMIT :limit に変更し、引数を追加
    @Query("SELECT * FROM works WHERE genre_tag LIKE :genre LIMIT :limit")
    Flux<Work> findByGenreTagContaining(String genre, int limit);

    // ★追加: 全ジャンルタグ (変更なし)
    @Query("SELECT genre_tag FROM works WHERE genre_tag IS NOT NULL")
    Flux<String> findAllGenreTags();
}