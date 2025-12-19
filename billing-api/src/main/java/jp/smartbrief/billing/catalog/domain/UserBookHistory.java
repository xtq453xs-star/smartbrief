package jp.smartbrief.billing.catalog.domain;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import lombok.Data;
import lombok.NoArgsConstructor; // 追加

/**
 * ユーザー書籍閲覧履歴エンティティ
 * 
 * ユーザーが閲覧した書籍の履歴を記録します。
 * ユーザーID、書籍 ID、タイトル、著者名、閲覧時刻などを保持します。
 */
@Table("user_book_history")
@Data
@NoArgsConstructor // 引数なしコンストラクタがあると安心
public class UserBookHistory {
    @Id
    private Long id;

    @Column("user_id")
    private Long userId;

    @Column("book_id")
    private Integer bookId; // WorkのIDを保存

    @Column("book_title")
    private String bookTitle;

    @Column("author_name")
    private String authorName;

    @Column("viewed_at")
    private LocalDateTime viewedAt;
}