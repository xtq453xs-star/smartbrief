package jp.smartbrief.billing.shared.security;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.web.server.context.ServerSecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.http.HttpCookie;

import reactor.core.publisher.Mono;

/**
 * セキュリティコンテキストリポジトリ
 * 
 * HTTP リクエストのヘッダーから JWT トークンを抽出し、
 * 認証マネージャーで検証後、SecurityContext を作成します。
 * WebFlux 環境でのリアクティブな認証処理を担当します。
 */
@Component
public class SecurityContextRepository implements ServerSecurityContextRepository {

    private final AuthenticationManager authenticationManager;

    public SecurityContextRepository(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    // ★ ここを追加！
    @Override
    public Mono<Void> save(ServerWebExchange swe, SecurityContext sc) {
        return Mono.empty();
    }

    @Override
    public Mono<SecurityContext> load(ServerWebExchange swe) {
        // 1. まずCookieからトークンを探す
        HttpCookie cookie = swe.getRequest().getCookies().getFirst("authToken");
        String authToken = (cookie != null) ? cookie.getValue() : null;

        // 2. Cookieになければ、従来のHeaderから探す (API経由など)
        if (authToken == null) {
            String authHeader = swe.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                authToken = authHeader.substring(7);
            }
        }

        if (authToken != null) {
            Authentication auth = new UsernamePasswordAuthenticationToken(authToken, authToken);
            return this.authenticationManager.authenticate(auth)
                .map(SecurityContextImpl::new);
        } else {
            return Mono.empty();
        }
    }
}