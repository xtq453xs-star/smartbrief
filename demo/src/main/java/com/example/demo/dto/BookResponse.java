package com.example.demo.dto;

import com.example.demo.domain.Work;

import lombok.Data;

@Data
public class BookResponse {
    private Integer id;
    private String title;
    private String authorName;
    private String aozoraUrl;
    
    // フロントエンドには統一して 'summaryText' として渡す
    private String summaryText; 
    
    private String catchphrase;
    private String insight;
    private boolean isHighQuality;
    private String genreTag;

    // ★★★ 追加: 海外翻訳対応 ★★★
    private String category;      // "AOZORA" or "TRANSLATION"
    private String originalTitle; // 原題
    private String bodyText;      // 翻訳本文

    public static BookResponse from(Work work) {
        BookResponse dto = new BookResponse();
        
        dto.setId(work.getId());
        dto.setTitle(work.getTitle());
        dto.setAuthorName(work.getAuthorName());
        dto.setAozoraUrl(work.getAozoraUrl());
        
        dto.setGenreTag(cleanText(work.getGenreTag()));

        // HQフラグ
        boolean isHq = Boolean.TRUE.equals(work.getIsHq());
        dto.setHighQuality(isHq);

        // HQなら summaryHq、通常なら summary300 をセットする
        if (isHq) {
            dto.setSummaryText(cleanText(work.getSummaryHq()));
        } else {
            dto.setSummaryText(cleanText(work.getSummary300()));
        }
        
        dto.setCatchphrase(cleanText(work.getCatchphrase()));
        dto.setInsight(cleanText(work.getInsight()));
        
        // ★★★ 追加: 海外翻訳データのセット ★★★
        dto.setCategory(work.getCategory() != null ? work.getCategory() : "AOZORA");
        dto.setOriginalTitle(cleanText(work.getOriginalTitle()));
        dto.setBodyText(work.getBodyText()); // 本文は cleanText せずにそのまま渡す

        return dto;
    }
    
    // [object Object] 対策
    private static String cleanText(String text) {
        if (text == null) return null;
        if (text.contains("[object Object]")) return null;
        return text;
    }
}