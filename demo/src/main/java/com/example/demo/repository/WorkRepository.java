package com.example.demo.repository;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import com.example.demo.domain.Work;

import reactor.core.publisher.Flux;

public interface WorkRepository extends ReactiveCrudRepository<Work, Integer> {

    // -------------------------------------------------------------------------
    // 1. キーワード検索
    // -------------------------------------------------------------------------

    // ★修正: 引数に offset を追加し、SQLに ORDER BY ... LIMIT ... OFFSET を追加
    // (ページネーション時は並び順を固定しないとページ間でデータがズレるため work_id ASC を入れています)
    @Query("SELECT * FROM aozora_db.works WHERE title LIKE :keyword OR author_name LIKE :keyword ORDER BY work_id ASC LIMIT :limit OFFSET :offset")
    Flux<Work> searchByKeyword(String keyword, int limit, int offset);

    // ★追加: 文字数（長編）順での検索
    @Query("SELECT * FROM aozora_db.works WHERE (title LIKE :keyword OR author_name LIKE :keyword) AND full_text IS NOT NULL ORDER BY CHAR_LENGTH(full_text) DESC LIMIT :limit OFFSET :offset")
    Flux<Work> searchByKeywordOrderByLength(String keyword, int limit, int offset);


    // -------------------------------------------------------------------------
    // 2. ジャンル検索
    // -------------------------------------------------------------------------

    // ★修正: 引数に offset を追加
    @Query("SELECT * FROM works WHERE genre_tag LIKE :genre ORDER BY work_id ASC LIMIT :limit OFFSET :offset")
    Flux<Work> findByGenreTagContaining(String genre, int limit, int offset);

    // ★追加: 文字数（長編）順でのジャンル検索
    @Query("SELECT * FROM works WHERE genre_tag LIKE :genre AND full_text IS NOT NULL ORDER BY CHAR_LENGTH(full_text) DESC LIMIT :limit OFFSET :offset")
    Flux<Work> findByGenreTagContainingOrderByLength(String genre, int limit, int offset);


    // -------------------------------------------------------------------------
    // 3. その他 (変更なし)
    // -------------------------------------------------------------------------

    // サジェスト (変更なし)
    @Query("SELECT * FROM aozora_db.works WHERE title LIKE :keyword OR author_name LIKE :keyword LIMIT 10")
    Flux<Work> suggestByKeyword(String keyword);

    // 作家一覧 (変更なし)
    @Query("SELECT author_name FROM works GROUP BY author_name ORDER BY COUNT(*) DESC LIMIT 20")
    Flux<String> findTopAuthors();

    // 全作家リスト (変更なし)
    @Query("SELECT author_name FROM works GROUP BY author_name ORDER BY COUNT(*) DESC")
    Flux<String> findAllAuthors();

    // 全ジャンルタグ (変更なし)
    @Query("SELECT genre_tag FROM works WHERE genre_tag IS NOT NULL")
    Flux<String> findAllGenreTags();
}