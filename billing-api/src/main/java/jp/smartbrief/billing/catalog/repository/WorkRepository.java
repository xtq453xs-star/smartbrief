package jp.smartbrief.billing.catalog.repository;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import jp.smartbrief.billing.catalog.domain.Work;
import reactor.core.publisher.Flux;

/**
 * 書籍リポジトリ
 * 
 * Work エンティティに対するデータベース操作を行う
 * リアクティブリポジトリです。
 * キーワード検索、ジャンル検索、著者検索、ページネーション対応クエリなどを提供します。
 */
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
 // ★★★ Task 2: カテゴリによるフィルタリング（翻訳作品検索用） ★★★
    // LIMITとOFFSETに対応
    @Query("SELECT * FROM works WHERE category = :category ORDER BY work_id DESC LIMIT :limit OFFSET :offset")
    Flux<Work> findByCategory(String category, int limit, int offset);

    // 文字数順で翻訳を探す場合
    @Query("SELECT * FROM works WHERE category = :category ORDER BY LENGTH(body_text) DESC LIMIT :limit OFFSET :offset")
    Flux<Work> findByCategoryOrderByLength(String category, int limit, int offset);

    /* * もし category カラムがまだ空で、著者名（英字）で判定したい場合の予備クエリ (MySQL用)
     * "NOT REGEXP '[ぁ-んァ-ン一-龥]'" -> 日本語を含まない＝英字作家
     */
    @Query("SELECT * FROM works WHERE author_name NOT REGEXP '[ぁ-んァ-ン一-龥]' LIMIT :limit OFFSET :offset")
    Flux<Work> findByEnglishAuthor(int limit, int offset);
}