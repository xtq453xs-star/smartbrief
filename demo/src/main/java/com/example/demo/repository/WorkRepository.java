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
}