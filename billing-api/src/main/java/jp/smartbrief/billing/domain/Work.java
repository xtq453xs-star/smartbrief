package jp.smartbrief.billing.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data; // ★これが重要：Getter/Setterを自動生成する
import lombok.NoArgsConstructor;

/**
 * 書籍エンティティ
 * 
 * 青空文庫および海外翻訳作品の書籍情報を表します。
 * タイトル、著者名、サマリー、ジャンル、画像 URL、
 * 本文、カテゴリなどの書籍の詳細情報を保持します。
 */
@Data // ★このアノテーションが getTitle() や getSummaryHq() を作ります
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("works")
public class Work {
    @Id
    @Column("work_id")
    private Integer id;

    private String title; // getTitle() の元

    @Column("author_name")
    private String authorName;
    
    // ★★★ ここに追加してください！ ★★★
    @Column("image_url")
    private String imageUrl;
    // ★★★★★★★★★★★★★★★★★★★★★★

    @Column("aozora_url")
    private String aozoraUrl;

    @Column("summary_300")
    private String summary300;

    @Column("summary_hq")
    private String summaryHq; // getSummaryHq() の元

    @Column("is_hq")
    private Boolean isHq; 

    @Column("catchphrase")
    private String catchphrase;

    @Column("insight")
    private String insight;

    @Column("genre_tag")
    private String genreTag;
    
    // --- 以下、海外翻訳用に追加したカラム ---
    @Column("category")
    private String category;

    @Column("original_title")
    private String originalTitle;
    
    @Column("summary_short")
    private String summaryShort;

    @Column("summary_long")
    private String summaryLong;

    @Column("body_text")
    private String bodyText;
}