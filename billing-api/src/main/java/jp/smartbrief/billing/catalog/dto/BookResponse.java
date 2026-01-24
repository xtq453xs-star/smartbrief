package jp.smartbrief.billing.catalog.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jp.smartbrief.billing.catalog.domain.Work;
import lombok.Data;

/**
 * 書籍レスポンス DTO (Data Transfer Object)
 * * クライアント（Web/LINE/React）に返すデータを整形します。
 * ビジネスルール（無料/プレミアムの表示制御）をカプセル化しています。
 */
@Data
public class BookResponse {
    // --- 基本情報 ---
    private Integer id;
    private String title;
    private String authorName;
    private String aozoraUrl;
    
    @JsonProperty("image_url") // Reactとの連携用
    private String imageUrl; 

    // --- メタデータ ---
    private String genreTag;
    private String catchphrase;
    private String insight;

    // --- 表示制御・UI状態 ---
    private String summaryText; // クライアントに実際に表示する要約
    private boolean highQuality; // Proバッジを表示するかどうか
    private boolean isLocked;    // 鍵アイコンを表示するかどうか

    // --- 海外翻訳作品用 ---
    @JsonProperty("isOverseas")
    private boolean isOverseas;
    private String category;      
    private String originalTitle; 
    private String bodyText;      

    // --- ★追加: AI感情検索用データ ---
    private String aiReason;  // AIが生成した「おすすめ理由」
    private Float matchScore; // クエリとの適合度 (0.0 ~ 1.0)

    // --- 古いWeb版との互換性維持用 ---
    private String summaryHq;
    private String summary300;

    /**
     * DBエンティティ(Work)をDTOに変換するファクトリーメソッド
     */
    public static BookResponse from(Work work, boolean isPremiumUser) {
        if (work == null) {
            return null;
        }

        BookResponse dto = new BookResponse();

        // 1. 基本情報のマッピング
        dto.setId(work.getId());
        dto.setTitle(getOrDefault(work.getTitle(), ""));
        dto.setAuthorName(getOrDefault(work.getAuthorName(), ""));
        dto.setImageUrl(getOrDefault(work.getImageUrl(), ""));
        dto.setAozoraUrl(work.getAozoraUrl());
        dto.setGenreTag(cleanText(work.getGenreTag()));
        dto.setCatchphrase(cleanText(work.getCatchphrase()));
        dto.setInsight(cleanText(work.getInsight()));
        dto.setCategory(work.getCategory() != null ? work.getCategory() : "AOZORA");
        dto.setOriginalTitle(cleanText(work.getOriginalTitle()));
        
        // 互換性維持用
        dto.setSummaryHq(cleanText(work.getSummaryHq()));
        dto.setSummary300(cleanText(work.getSummary300()));

        // 2. AI検索データのマッピング（追加部分）
        dto.setAiReason(work.getAiReason());
        dto.setMatchScore(work.getMatchScore());

        // 3. 作品タイプの判定
        boolean isTranslation = "Gutenberg".equalsIgnoreCase(dto.getCategory()) || "TRANSLATION".equalsIgnoreCase(dto.getCategory());
        boolean hasHqData = Boolean.TRUE.equals(work.getIsHq());
        dto.setOverseas(isTranslation);

        // 4. ビジネスルールに基づくUI制御（責務をプライベートメソッドに分割）
        dto.setSummaryText(determineSummaryText(work, isTranslation, isPremiumUser, hasHqData));
        dto.setLocked(determineLockStatus(isTranslation, isPremiumUser, hasHqData));
        dto.setHighQuality(determineHqStatus(isTranslation, isPremiumUser, hasHqData));

        // 一覧取得時はメモリ節約のため本文を返さない
        dto.setBodyText(null); 

        return dto;
    }

    // =========================================================================
    // ビジネスロジック・ヘルパーメソッド
    // =========================================================================

    /**
     * 表示すべき要約テキストを決定する
     */
    private static String determineSummaryText(Work work, boolean isTranslation, boolean isPremium, boolean hasHq) {
        if (isTranslation) {
            if (hasText(work.getSummaryLong())) return cleanText(work.getSummaryLong());
            if (hasText(work.getSummaryShort())) return cleanText(work.getSummaryShort());
            return cleanText(work.getSummaryHq());
        }

        // 青空文庫の場合
        if (hasHq && isPremium) {
            return cleanText(work.getSummaryHq());
        }
        return cleanText(work.getSummary300());
    }

    /**
     * 作品に鍵（ロック）をかけるべきかを決定する
     */
    private static boolean determineLockStatus(boolean isTranslation, boolean isPremium, boolean hasHq) {
        if (isTranslation) return false; // 翻訳作品は一覧ではロックしない
        return hasHq && !isPremium;      // HQあり＋無料ユーザー ならロック
    }

    /**
     * Pro（高品質）バッジを表示すべきかを決定する
     */
    private static boolean determineHqStatus(boolean isTranslation, boolean isPremium, boolean hasHq) {
        if (isTranslation) return hasHq; // 翻訳はデータがあればバッジ表示
        return hasHq && isPremium;       // 青空文庫はプレミアムのみバッジ表示
    }

    // =========================================================================
    // ユーティリティメソッド
    // =========================================================================

    private static String cleanText(String text) {
        if (text == null || text.contains("[object Object]")) return null;
        return text;
    }

    private static boolean hasText(String text) {
        return text != null && !text.isEmpty();
    }

    private static String getOrDefault(String text, String defaultValue) {
        return text != null ? text : defaultValue;
    }
}