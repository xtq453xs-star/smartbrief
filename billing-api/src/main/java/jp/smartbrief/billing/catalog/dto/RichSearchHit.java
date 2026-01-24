package jp.smartbrief.billing.catalog.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Go検索APIからのレスポンスを受け取るDTO
 * * JSON例: {"id": 123, "score": 0.85, "title": "人間失格", "aiReason": "..."}
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record RichSearchHit(
    Integer id,
    Float score,
    String title,
    String author,
    String aiReason // ★ ここにGroqの生成結果が入る
) {}