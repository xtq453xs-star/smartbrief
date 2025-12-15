package com.example.demo.dto; // ★ Controllerに合わせてパッケージを dto にする

import com.example.demo.domain.Work;
import com.fasterxml.jackson.annotation.JsonProperty; // 追加

import lombok.Data;

@Data
public class BookResponse {
    private Integer id;
    private String title;
    private String authorName;
    private String aozoraUrl;
    
    // ★ React側が "image_url" で待っているので、JSONキー名を固定
    // Java内では imageUrl (キャメルケース) として扱えるので安全です
    @JsonProperty("image_url")
    private String imageUrl; 
    
    // --- LINE/Web表示用 統合テキスト ---
    private String summaryText; 
    
    private String catchphrase;
    private String insight;
    
    // Web/LINE共通: HQバッジを表示するかどうかのフラグ
    private boolean highQuality; 
    // Web/LINE共通: 鍵アイコンを表示するかどうかのフラグ
    private boolean isLocked;
    
    private String genreTag;
    
    // --- 海外翻訳用 ---
    @JsonProperty("isOverseas") // n8n/React用にキー名を固定
    private boolean isOverseas;
    private String category;      
    private String originalTitle; 
    private String bodyText;      

    // ★ Web版が「生のデータ」を使っている場合の保険として、これらもJSONに含めておきます
    private String summaryHq;
    private String summary300;

    public static BookResponse from(Work work, boolean isPremiumUser) {
        if (work == null) {
            return null;
        }

        BookResponse dto = new BookResponse();
        
        dto.setId(work.getId());
        dto.setTitle(work.getTitle() != null ? work.getTitle() : "");
        dto.setAuthorName(work.getAuthorName() != null ? work.getAuthorName() : "");
        
        // ★ 画像URL: nullケアをしてセット
        dto.setImageUrl(work.getImageUrl() != null ? work.getImageUrl() : "");
        
        dto.setAozoraUrl(work.getAozoraUrl());
        dto.setGenreTag(cleanText(work.getGenreTag()));
        dto.setCatchphrase(cleanText(work.getCatchphrase()));
        dto.setInsight(cleanText(work.getInsight()));
        
        // --- 生データの保持 (Web版への安全策) ---
        dto.setSummaryHq(cleanText(work.getSummaryHq()));
        dto.setSummary300(cleanText(work.getSummary300()));
        
        // --- カテゴリ判定 ---
        String cat = work.getCategory();
        dto.setCategory(cat != null ? cat : "AOZORA");
        dto.setOriginalTitle(cleanText(work.getOriginalTitle()));
        dto.setBodyText(work.getBodyText());

        boolean isGutenberg = "Gutenberg".equalsIgnoreCase(cat) || "TRANSLATION".equalsIgnoreCase(cat);
        dto.setOverseas(isGutenberg);

        // --- ロジック統一: どのテキストを表示し、鍵をかけるか ---
        boolean hasHqData = Boolean.TRUE.equals(work.getIsHq());

        if (isGutenberg) {
            // 海外作品: ロックなし、あるものを表示
            if (hasText(work.getSummaryLong())) {
                dto.setSummaryText(cleanText(work.getSummaryLong()));
            } else if (hasText(work.getSummaryShort())) {
                dto.setSummaryText(cleanText(work.getSummaryShort()));
            } else {
                dto.setSummaryText(cleanText(work.getSummaryHq()));
            }
            dto.setLocked(false);
            dto.setHighQuality(hasHqData); // HQデータ由来ならバッジ表示
            
        } else {
            // 青空文庫: プレミアム判定
            if (hasHqData) {
                if (isPremiumUser) {
                    // プレミアム: HQ表示、ロック解除、キラキラアイコンON
                    dto.setSummaryText(cleanText(work.getSummaryHq()));
                    dto.setLocked(false);
                    dto.setHighQuality(true); 
                } else {
                    // 無料: 300文字表示、ロックON、キラキラアイコンOFF
                    dto.setSummaryText(cleanText(work.getSummary300()));
                    dto.setLocked(true);
                    dto.setHighQuality(false); 
                }
            } else {
                // HQなし: 300文字表示、ロック解除
                dto.setSummaryText(cleanText(work.getSummary300()));
                dto.setLocked(false);
                dto.setHighQuality(false);
            }
        }
        
        return dto;
    }

    private static String cleanText(String text) {
        if (text == null) return null;
        if (text.contains("[object Object]")) return null;
        return text;
    }

    private static boolean hasText(String text) {
        return text != null && !text.isEmpty();
    }
}