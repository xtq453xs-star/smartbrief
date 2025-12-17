package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 課金ステータス DTO (Data Transfer Object)
 * 
 * ユーザーの課金情報（プラン、有効期限など）をクライアントに返すための
 * データ転送オブジェクトです。
 */
// Lombokを使わない場合は、Getters/Settersを手動で定義してください
@Data 
@NoArgsConstructor
@AllArgsConstructor
public class BillingStatusDto {
    private String username;
    private String planType;
    private boolean premium;
    
    // ★追加: 有効期限をフロントエンドに渡すためのフィールド
    private String subscriptionExpiresAt; 
}