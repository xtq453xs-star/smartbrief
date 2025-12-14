package com.example.demo.security;

import java.util.Collections;
import java.util.List;

import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import com.example.demo.util.JwtUtil;

import reactor.core.publisher.Mono;

@Component
public class AuthenticationManager implements ReactiveAuthenticationManager {

    private final JwtUtil jwtUtil;

    public AuthenticationManager(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public Mono<Authentication> authenticate(Authentication authentication) {
        String authToken = authentication.getCredentials().toString();
        String username;
        try {
           System.out.println("🔍 [AuthManager] Token received: " + authToken.substring(0, 10) + "...");
            
            username = jwtUtil.extractUsername(authToken);
        } catch (Exception e) {
            System.out.println("❌ [AuthManager] Token extraction failed: " + e.getMessage());
            // エラーを握りつぶさず、ログレベルをWARNなどに設定してSpring Logbackに任せるのが理想です
            username = null;
        }

        if (username != null && jwtUtil.validateToken(authToken, username)) {
            System.out.println("✅ [AuthManager] Token valid for user: " + username);
            List<SimpleGrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
            
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                username,
                username,
                authorities
            );
            return Mono.just(auth);
        } else {
            System.out.println("⚠️ [AuthManager] Token validation returned false (username=" + username + ")");
            return Mono.empty();
        }
    }
}