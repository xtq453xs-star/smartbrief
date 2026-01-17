package jp.smartbrief.billing.catalog.dto;

import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AISearchResponse(
    List<ScoredPoint> result
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ScoredPoint(
        // ★修正: id は数字ではなく、複雑なMapとして受け取る
        @JsonProperty("id") Map<String, Map<String, Long>> idObj,
        @JsonProperty("score") Double score,
        @JsonProperty("payload") Map<String, Object> payload
    ) {
        // ★追加: 複雑なMapから、実際のID(数値)を取り出す魔法のメソッド
        public Long getIdAsLong() {
            try {
                if (idObj != null && idObj.containsKey("PointIdOptions")) {
                    Map<String, Long> options = idObj.get("PointIdOptions");
                    if (options != null && options.containsKey("Num")) {
                        return options.get("Num");
                    }
                }
            } catch (Exception e) {
                // エラー時はnull
            }
            return null;
        }
    }
}