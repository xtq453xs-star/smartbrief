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
     * * <p>判定ルール:</p>
     * <ol>
     * <li>プレミアム会員は、いかなる場合もロックされない (最優先)</li>
     * <li>海外翻訳作品は、無料会員でもロックされない (現状の仕様)</li>
     * <li>青空文庫作品で、高品質データ(HQ)があり、かつ無料会員の場合はロックする</li>
     * </ol>
     */
    private static boolean determineLockStatus(boolean isTranslation, boolean isPremium, boolean hasHq) {
        // Rule 1: プレミアム会員なら無条件で閲覧可能 (ロックなし)
        // ここで true を返さないようにすることで、有料会員の閲覧不可バグを根絶します。
        if (isPremium) {
            return false;
        }

        // --- 以下、無料会員向けの判定 ---

        // Rule 2: 翻訳作品は基本的に無料開放する
        if (isTranslation) {
            return false;
        }

        // Rule 3: 青空文庫でHQデータ（付加価値データ）がある場合はロックする
        if (hasHq) {
            return true;
        }

        // それ以外（通常の青空文庫など）はロックしない
        return false;
    }

    /**
     * Pro（高品質）バッジを表示すべきかを決定する
     */
    private static boolean determineHqStatus(boolean isTranslation, boolean isPremium, boolean hasHq) {
        // 翻訳作品は、データがあれば誰にでもバッジを表示（誘引のため）
        if (isTranslation) {
            return hasHq; 
        }
        // 青空文庫は、プレミアム会員かつデータがある場合のみバッジを表示
        return hasHq && isPremium;       
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