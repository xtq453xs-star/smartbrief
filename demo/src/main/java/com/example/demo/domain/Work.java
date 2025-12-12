package com.example.demo.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import com.fasterxml.jackson.annotation.JsonProperty; // ★追加

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("works")
public class Work {

    @Id
    @Column("work_id")
    @JsonProperty("work_id") // JSONでの名前を指定
    private Integer id;

    private String title;

    @Column("author_name")
    @JsonProperty("author_name")
    private String authorName;

    @Column("aozora_url")
    @JsonProperty("aozora_url")
    private String aozoraUrl;

    @Column("summary_300")
    @JsonProperty("summary_300")
    private String summary300;

    // --- ここからPattern A用 ---

    @Column("summary_hq")
    @JsonProperty("summary_hq") // ★これがないと React側で book.summary_hq が undefined になる
    private String summaryHq;

    @Column("is_hq")
    @JsonProperty("is_hq") // ★これがないと React側で book.is_hq が undefined になる
    private Boolean isHq; 
    // ※注意: JavaでBooleanの場合、JSONは true/false になります。
    // React側で `book.is_hq === 1` ではなく `!!book.is_hq` や `book.is_hq === true` で判定すると安全です。

    @Column("catchphrase")
    // 名前が同じでも念のため @Column 推奨
    private String catchphrase;

    @Column("insight")
    private String insight;

    // --- ここまで ---

    @Column("genre_tag")
    @JsonProperty("genre_tag")
    private String genreTag;
    
    @Column("category")
    private String category;

    @Column("original_title")
    @JsonProperty("original_title")
    private String originalTitle;

    @Column("body_text")
    @JsonProperty("body_text")
    private String bodyText;
}