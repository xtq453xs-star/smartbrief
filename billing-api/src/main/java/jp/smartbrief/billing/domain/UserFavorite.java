package jp.smartbrief.billing.domain;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ユーザーお気に入りエンティティ
 * 
 * ユーザーがお気に入り登録した書籍情報を保持します。
 * ユーザーID、書籍 ID、タイトル、著者名、作成日時などを含みます。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("user_favorites")
public class UserFavorite {
    @Id
    private Long id;
    
    @Column("user_id")
    private Long userId;
    
    @Column("book_id")
    private Integer bookId;
    
    @Column("book_title")
    private String bookTitle;
    
    @Column("author_name")
    private String authorName;
    
    @Column("created_at")
    private LocalDateTime createdAt;
}