package com.example.demo.repository;

import com.example.demo.domain.Work;

import lombok.Data;

@Data
public class BookResponse {
    private Integer id;
    private String title;
    private String authorName;
    private String aozoraUrl;
    
    // フロント表示用のメインテキスト
    private String summaryText; 
    
    private String catchphrase;
    private String insight;
    private boolean isHighQuality;
    private boolean isLocked;
    private String genreTag;
    
    // 海外翻訳用フィールド
    private String category;      // "Gutenberg" or "AOZORA"
    private String originalTitle; // 原題
    private String bodyText;      // 翻訳本文またはダイジェスト

    public static BookResponse from(Work work, boolean isPremiumUser) {
        // ★修正1: work自体がnullの場合のガード句を追加 (これが500エラーの主犯です)
        if (work == null) {
            return null;
        }

        BookResponse dto = new BookResponse();
        
        dto.setId(work.getId());
        // タイトルや著者名も念のため null なら空文字にしておくとフロントが楽です
        dto.setTitle(work.getTitle() != null ? work.getTitle() : "");
        dto.setAuthorName(work.getAuthorName() != null ? work.getAuthorName() : "");
        
        dto.setAozoraUrl(work.getAozoraUrl());
        dto.setGenreTag(cleanText(work.getGenreTag()));
        dto.setCatchphrase(cleanText(work.getCatchphrase()));
        dto.setInsight(cleanText(work.getInsight()));
        
        // --- カテゴリと翻訳情報のマッピング ---
        String cat = work.getCategory();
        dto.setCategory(cat != null ? cat : "AOZORA");
        dto.setOriginalTitle(cleanText(work.getOriginalTitle()));
        dto.setBodyText(work.getBodyText()); // 本文はnullチェックのみでクリーニングしない

        // --- 要約テキストの決定ロジック ---
        boolean isGutenberg = "Gutenberg".equalsIgnoreCase(cat) || "TRANSLATION".equalsIgnoreCase(cat);
        // getIsHq() が null の場合は false として扱う
        boolean isHq = Boolean.TRUE.equals(work.getIsHq());
        dto.setHighQuality(isHq);

        if (isGutenberg) {
            // Gutenbergの場合の優先順位: summary_long > summary_short > summary_hq
            if (work.getSummaryLong() != null && !work.getSummaryLong().isEmpty()) {
                dto.setSummaryText(cleanText(work.getSummaryLong()));
            } else if (work.getSummaryShort() != null) {
                dto.setSummaryText(cleanText(work.getSummaryShort()));
            } else {
                dto.setSummaryText(cleanText(work.getSummaryHq()));
            }
            
            // 翻訳作品は基本的にロックなし
            dto.setLocked(false); 
        } else {
            // 青空文庫(AOZORA)の場合のロジック
            if (isHq) {
                if (isPremiumUser) {
                    dto.setSummaryText(cleanText(work.getSummaryHq()));
                    dto.setLocked(false);
                } else {
                    // 無料会員には300文字版を見せる
                    dto.setSummaryText(cleanText(work.getSummary300()));
                    dto.setLocked(true);
                }
            } else {
                // HQがない作品
                dto.setSummaryText(cleanText(work.getSummary300()));
                dto.setLocked(false);
            }
        }
        
        return dto;
    }

    private static String cleanText(String text) {
        if (text == null) return null;
        // DBに誤って保存されたJSオブジェクト文字列を除去
        if (text.contains("[object Object]")) return null;
        // 空文字もnull扱いにするならここに追加（お好みで）
        // if (text.trim().isEmpty()) return null; 
        return text;
    }
}