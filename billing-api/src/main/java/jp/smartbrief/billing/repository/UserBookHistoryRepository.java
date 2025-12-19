package jp.smartbrief.billing.repository;

import java.time.LocalDateTime;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import jp.smartbrief.billing.domain.UserBookHistory;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * ユーザー書籍閲覧履歴リポジトリ
 * 
 * UserBookHistory エンティティに対するデータベース操作を行う
 * リアクティブリポジトリです。
 * 閲覧履歴の保存、検索、ランキング集計などのクエリを提供します。
 */
@Repository
public interface UserBookHistoryRepository extends R2dbcRepository<UserBookHistory, Long> {

    // 既存のメソッド（履歴一覧取得）
    Flux<UserBookHistory> findHistoryByUserId(Long userId);

    // 既存のメソッド（1日の閲覧回数カウント）
    Mono<Long> countByUserIdAndViewedAtAfter(Long userId, LocalDateTime viewedAt);

    // 既存のメソッド（人気ランキング用ID取得）
    // ※もしネイティブクエリで書いている場合はそのままでOKです。
    // ここでは一般的なクエリメソッドの例として書いておきます。
    @Query("SELECT book_id FROM user_book_history GROUP BY book_id ORDER BY COUNT(book_id) DESC LIMIT 10")
    Flux<Integer> findTopBookIds();

    // ★★★ 今回のエラーを解消するために追加するメソッド ★★★
    // 「特定のユーザー」かつ「特定の本」の履歴を、「閲覧日時が新しい順」に並べて「最初の1件」を取得する
    Mono<UserBookHistory> findFirstByUserIdAndBookIdOrderByViewedAtDesc(Long userId, Integer bookId);
}