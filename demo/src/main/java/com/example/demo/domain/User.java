package com.example.demo.domain;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Table("users")
public class User {

    @Id
    private Long id;
    private String username;
    private String password;
    
    // ★認証用: 役割 ("ROLE_USER,ROLE_ADMIN")
    private String roles;

    // ★課金用: プランタイプと期限
    @Column("plan_type")
    private String planType;

    @Column("subscription_expires_at")
    private LocalDateTime subscriptionExpiresAt;

    @Column("created_at")
    private LocalDateTime createdAt;

    // ★★★★★ 追加: Plan Enumの定義 ★★★★★
    // これで User.Plan.PREMIUM が使えるようになります
    public enum Plan {
        FREE, PREMIUM
    }
    // ★★★★★★★★★★★★★★★★★★★★★★★★

    // --- コンストラクタ ---
    public User() {
    }

    // --- Getters & Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    // rolesの処理 (List <-> String 変換)
    public String getRoles() { return roles; }
    public void setRoles(String roles) { this.roles = roles; } // DB読み込み用
    
    public void setRoles(List<String> rolesList) {
        if (rolesList != null && !rolesList.isEmpty()) {
            this.roles = String.join(",", rolesList);
        } else {
            this.roles = "ROLE_USER";
        }
    }
    
    public List<String> getRolesAsList() {
        if (this.roles == null || this.roles.isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.asList(this.roles.split(","));
    }

    // 課金用フィールドのGetter/Setter
    public String getPlanType() { return planType; }
    public void setPlanType(String planType) { this.planType = planType; }

    public LocalDateTime getSubscriptionExpiresAt() { return subscriptionExpiresAt; }
    public void setSubscriptionExpiresAt(LocalDateTime subscriptionExpiresAt) { this.subscriptionExpiresAt = subscriptionExpiresAt; }

    // --- BookController対応のための追加メソッド（ここから）---
    
    // ★追加: Controllerが要求する getCurrentPlan() に対応
    public String getCurrentPlan() { 
        return this.planType; 
    }

    // ★追加: Controllerが要求する getPremium() に対応
    // プレミアムプランであり、かつ有効期限が現在日時よりも後である場合にtrueを返す
    public Boolean getPremium() {
        // Plan.PREMIUM.name() は "PREMIUM" という文字列を返します
        return Plan.PREMIUM.name().equalsIgnoreCase(this.planType) 
            && this.subscriptionExpiresAt != null
            && this.subscriptionExpiresAt.isAfter(LocalDateTime.now());
    }
    
    // --- 追加メソッド（ここまで）---


    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}