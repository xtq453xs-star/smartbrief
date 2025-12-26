package jp.smartbrief.billing.shared.security;

import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import jp.smartbrief.billing.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * リアクティブ認証マネージャー
 * * 責務:
 * 1. JWTトークンの検証 (形式チェック・期限チェック)
 * 2. DBからのユーザー情報ロード (存在チェック・権限ロード)
 * 3. Spring Security用 認証オブジェクトの生成
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AuthenticationManager implements ReactiveAuthenticationManager {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    public Mono<Authentication> authenticate(Authentication authentication) {
        String authToken = authentication.getCredentials().toString();
        String username;

        // --- Phase 1: トークンの解析と検証 (Fail-Fast) ---
        try {
            username = jwtUtil.extractUsername(authToken);
            
            // ユーザー名が取れない、またはトークンが無効な場合は即座に終了
            if (username == null || !jwtUtil.validateToken(authToken, username)) {
                log.warn("Authentication failed: Token invalid or expired.");
                return Mono.empty();
            }
        } catch (Exception e) {
            log.warn("Authentication failed: Invalid token format. Error: {}", e.getMessage());
            return Mono.empty();
        }

        // --- Phase 2: DB参照と認証オブジェクト生成 (Happy Path) ---
        return userRepository.findByUsername(username)
            .map(user -> {
                log.debug("User authenticated successfully: {}", username);
                
                // PrincipalにUserエンティティそのものをセット
                return new UsernamePasswordAuthenticationToken(
                    user, 
                    null, 
                    user.getAuthorities()
                );
            })
            // ★重要: ここで明示的に型を Authentication に変換します
            .cast(Authentication.class)
            // DBにユーザーがいなかった場合の処理
            .switchIfEmpty(Mono.defer(() -> {
                log.warn("Authentication failed: User not found in DB: {}", username);
                return Mono.empty();
            }));
    }
}