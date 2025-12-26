package jp.smartbrief.billing.shared.dto;

import jp.smartbrief.billing.identity.domain.User;

/**
 * ユーザーコンテキスト
 * コントローラー層で「現在のユーザー状態（ログイン有無・課金状態）」を
 * 統一的に扱うための軽量なDTOです。
 */
public record UserContext(Long userId, String username, boolean isPremium, User rawUser) {

    // ゲスト（未ログイン）状態を返す
    public static UserContext guest() {
        return new UserContext(null, null, false, null);
    }

    // ★追加: Spring SecurityのUserから変換する便利メソッド
    public static UserContext from(User user) {
        if (user == null) {
            return guest();
        }
        // Userエンティティの getPremium() ロジックをそのまま活用
        return new UserContext(user.getId(), user.getUsername(), user.getPremium(), user);
    }

    // ログインしているかどうかの判定
    public boolean isAuthenticated() {
        return userId != null;
    }
}