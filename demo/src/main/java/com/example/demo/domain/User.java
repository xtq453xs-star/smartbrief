package com.example.demo.domain;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("users")
public class User implements UserDetails {

    @Id
    private Long id;

    private String username;
    private String password;

    // 認証用ロール (カンマ区切り文字列: "ROLE_USER,ROLE_ADMIN")
    private String roles;

    // 課金用プラン (FREE / PREMIUM)
    @Column("plan_type")
    private String planType;

    // ★復活: LINE連携用ID (これが無いとLINE機能が動きません)
    @Column("line_user_id")
    private String lineUserId;

    @Column("subscription_expires_at")
    private LocalDateTime subscriptionExpiresAt;

    @Column("created_at")
    private LocalDateTime createdAt;

    // --- Enum定義 ---
    public enum Plan {
        FREE, PREMIUM
    }

    // --- 便利なロジックメソッド ---

    // Controllerが要求するプラン取得メソッド
    public String getCurrentPlan() {
        return this.planType;
    }

    // プレミアム会員かどうかの判定ロジック
    public Boolean getPremium() {
        // プランがPREMIUM かつ 期限が切れていないこと
        return Plan.PREMIUM.name().equalsIgnoreCase(this.planType)
                && this.subscriptionExpiresAt != null
                && this.subscriptionExpiresAt.isAfter(LocalDateTime.now());
    }

    // --- UserDetails インターフェースの実装 ---
    
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (roles == null || roles.isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.stream(roles.split(","))
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }

    @Override
    public boolean isAccountNonExpired() { return true; }
    @Override
    public boolean isAccountNonLocked() { return true; }
    @Override
    public boolean isCredentialsNonExpired() { return true; }
    @Override
    public boolean isEnabled() { return true; }
    
    // --- 手動Setter (Lombokと共存させるための特殊処理) ---
    
    // リストでロールをセットしたい場合のヘルパー
    public void setRolesList(List<String> rolesList) {
        if (rolesList != null && !rolesList.isEmpty()) {
            this.roles = String.join(",", rolesList);
        } else {
            this.roles = "ROLE_USER";
        }
    }
}