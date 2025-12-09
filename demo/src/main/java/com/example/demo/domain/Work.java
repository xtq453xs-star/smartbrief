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

    // ★修正: 実在するカラム名 'summary_300' に合わせる
    @Column("summary_300")
    private String summary300;

    // ★修正: 実在するカラム名 'summary_hq' に合わせる
    @Column("summary_hq")
    private String summaryHq;

    @Column("is_hq")
    private Boolean isHq;

    private String catchphrase;

    private String insight;
}