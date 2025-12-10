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

    public static BookResponse from(Work work) {
        BookResponse dto = new BookResponse();
        
        dto.setId(work.getId());
        dto.setTitle(work.getTitle());
        dto.setAuthorName(work.getAuthorName());
        dto.setAozoraUrl(work.getAozoraUrl());
        // ★追加
        dto.setGenreTag(cleanText(work.getGenreTag()));

        // HQフラグ
        boolean isHq = Boolean.TRUE.equals(work.getIsHq());
        dto.setHighQuality(isHq);

        // ★修正: HQなら summaryHq、通常なら summary300 をセットする
        if (isHq) {
            dto.setSummaryText(cleanText(work.getSummaryHq()));
        } else {
            dto.setSummaryText(cleanText(work.getSummary300()));
        }
        
        dto.setCatchphrase(cleanText(work.getCatchphrase()));
        dto.setInsight(cleanText(work.getInsight()));
        
        return dto;
    }
    
    // [object Object] 対策
    private static String cleanText(String text) {
        if (text == null) return null;
        if (text.contains("[object Object]")) return null;
        return text;
    }
}