package com.example.demo.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

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
    @Column("work_id") // DBのカラム名 'work_id' にマッピング
    private Integer id;

    private String title;

    @Column("author_name")
    private String authorName;

    @Column("aozora_url")
    private String aozoraUrl;

    // 通常要約
    @Column("summary_300")
    private String summary300;

    // HQ要約
    @Column("summary_hq")
    private String summaryHq;

    @Column("is_hq")
    private Boolean isHq;

    // ★★★ ここに追加！ ★★★
    // DBの genre_tag カラム ("エッセイ, 日本文学" など) を読み込む
    @Column("genre_tag")
    private String genreTag;

    private String catchphrase;

    private String insight;
}