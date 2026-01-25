package jp.smartbrief.billing.catalog.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Go検索APIからのレスポンスを受け取るDTO
 * * JSON例: {"id": 123, "score": 0.85, "title": "人間失格", "aiReason": "..."}
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record RichSearchHit(
    @JsonProperty("id") Long id,      // IntegerからLongへ変更
    @JsonProperty("score") Float score,
    @JsonProperty("title") String title,
    @JsonProperty("author") String author,
    @JsonProperty("aiReason") String aiReason // キャメルケースを明示
) {}