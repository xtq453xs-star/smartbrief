package jp.smartbrief.billing.identity.domain;

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

/**
 * ユーザーエンティティ
 * 
 * このクラスは、アプリケーションのユーザー情報を表します。
 * ユーザーID、ユーザー名、メールアドレス、パスワード、課金プラン、
 * LINE 連携情報、Stripe 顧客 ID などを保持します。
 * UserDetails インターフェースを実装し、Spring Security と統合します。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("users")
public class User implements UserDetails {

    @Id
    private Long id;

    private String username;
    
    // ★追加: メールアドレス
    private String email;
    
    private String password;

    // 認証用ロール (カンマ区切り文字列: "ROLE_USER,ROLE_ADMIN")
    private String roles;

    // 課金用プラン (FREE / PREMIUM)
    @Column("plan_type")
    private String planType;

    // LINE連携用ID
    @Column("line_user_id")
    private String lineUserId;

    // Stripe顧客ID
    @Column("stripe_customer_id")
    private String stripeCustomerId;

    @Column("subscription_expires_at")
    private LocalDateTime subscriptionExpiresAt;

    @Column("created_at")
    private LocalDateTime createdAt;
    
    // ★★★ 追加: パスワードリセット用 ★★★
    @Column("reset_password_token")
    private String resetPasswordToken;

    @Column("reset_password_expires_at")
    private LocalDateTime resetPasswordExpiresAt;
    
    @Column("is_verified")
    private Boolean isVerified; // true: 認証済み, false: 未認証
    
    // 認証用トークン
    @Column("verification_token")
    private String verificationToken;

    // --- Enum定義 ---
    public enum Plan {
        FREE, PREMIUM
    }

    // --- 便利なロジックメソッド ---

    public String getCurrentPlan() {
        return this.planType;
    }

    public Boolean getPremium() {
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
    public boolean isEnabled() {
        // ★重要: メール認証が完了していないと「無効なアカウント」として扱う
        // ※ nullの場合は古いユーザーとみなしてtrue (認証済み扱い) にするか、
        //   SQLで全員trueにしたので基本は true/false のどちらかになるはず。
        return isVerified != null && isVerified;
    }
        
    // 手動Setter (Lombokと共存させるためのヘルパー)
    public void setRolesList(List<String> rolesList) {
        if (rolesList != null && !rolesList.isEmpty()) {
            this.roles = String.join(",", rolesList);
        } else {
            this.roles = "ROLE_USER";
        }
    }
}