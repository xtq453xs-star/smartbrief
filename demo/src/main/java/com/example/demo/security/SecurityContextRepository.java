package com.example.demo.security;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.web.server.context.ServerSecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import reactor.core.publisher.Mono;

@Component
public class SecurityContextRepository implements ServerSecurityContextRepository {

    private final AuthenticationManager authenticationManager;

    public SecurityContextRepository(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    @Override
    public Mono<Void> save(ServerWebExchange swe, SecurityContext sc) {
        // ★修正: 例外を投げずに、何もしない(empty)を返すのが正解
        return Mono.empty();
    }

    @Override
    public Mono<SecurityContext> load(ServerWebExchange swe) {
        return Mono.justOrEmpty(swe.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION))
            .filter(authHeader -> authHeader.startsWith("Bearer "))
            .flatMap(authHeader -> {
                String authToken = authHeader.substring(7);
                
                // ★デバッグ用ログ: ここでトークンが見えていればフロントは送れている
                //System.out.println("🔍 [Repo] Checking Token: " + authToken.substring(0, Math.min(10, authToken.length())) + "...");

                Authentication auth = new UsernamePasswordAuthenticationToken(authToken, authToken);
                
                return this.authenticationManager.authenticate(auth)
                    .map(SecurityContextImpl::new);
            });
    }
}