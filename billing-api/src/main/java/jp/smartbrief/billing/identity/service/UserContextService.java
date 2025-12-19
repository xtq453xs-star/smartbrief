package jp.smartbrief.billing.identity.service;

// --- 1. Spring Framework 関連 ---
import org.springframework.stereotype.Service;

// --- 2. Project Reactor (非同期) 関連 ---
import reactor.core.publisher.Mono;

// --- 3. Lombok 関連 ---
import lombok.RequiredArgsConstructor;

// --- 4. 自分のプロジェクトの別パッケージから呼ぶもの ---
// ※ フォルダ移動後の正しいパスに合わせて import する必要があります
import jp.smartbrief.billing.identity.domain.User;
import jp.smartbrief.billing.identity.repository.UserRepository;
import jp.smartbrief.billing.shared.security.JwtUtil;

@Service
@RequiredArgsConstructor
public class UserContextService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    /**
     * Authヘッダーからユーザーを特定し、プレミアム状態判定付きで返す
     * ※ これを使えば、どのコントローラーでも1行で状態を取得できます。
     */
    public Mono<UserContext> resolveUserContext(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return Mono.just(UserContext.guest());
        }
        
        String token = authHeader.substring(7);
        // JWTからユーザー名を抽出（バリデーション込み）
        String username;
        try {
            username = jwtUtil.extractUsername(token);
        } catch (Exception e) {
            return Mono.just(UserContext.guest());
        }

        // DBから最新情報を取得 (ここがSingle Source of Truth)
        return userRepository.findByUsername(username)
            .map(user -> {
                boolean isPremium = user.getPremium(); // Userクラスのメソッドを利用
                return new UserContext(user.getId(), user.getUsername(), isPremium, user);
            })
            .defaultIfEmpty(UserContext.guest());
    }

    // 内部クラス、または shared.dto に配置
    public record UserContext(Long userId, String username, boolean isPremium, User rawUser) {
        public static UserContext guest() {
            return new UserContext(null, null, false, null);
        }
        public boolean isAuthenticated() {
            return userId != null;
        }
    }
    public Mono<UserContext> resolveUserContextByLineId(String lineUserId) {
    if (lineUserId == null) return Mono.just(UserContext.guest());

    return userRepository.findByLineUserId(lineUserId)
        .map(user -> new UserContext(user.getId(), user.getUsername(), user.getPremium(), user))
        .defaultIfEmpty(UserContext.guest());
    }
}