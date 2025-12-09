package com.example.demo; // パッケージ名は環境に合わせてください

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.authentication.HttpStatusServerEntryPoint;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
            // CSRF, Basic認証, フォームログインを無効化
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
            .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
            
            // ★ Basic認証ポップアップ防止設定
            .exceptionHandling(exceptionHandling -> exceptionHandling
                .authenticationEntryPoint(new HttpStatusServerEntryPoint(HttpStatus.UNAUTHORIZED))
            )

            // CORS設定を適用
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            .authorizeExchange(exchanges -> exchanges
                // 1. フロントエンドからの事前通信(OPTIONS)は全て許可
                .pathMatchers(HttpMethod.OPTIONS).permitAll()
                
                // 2. ログイン・登録画面は許可
                .pathMatchers("/api/v1/auth/**").permitAll()
                
                // 3. Webhookも許可
                .pathMatchers("/api/v1/webhook/**").permitAll()
                
                // 4. 本のAPIも「許可」
                .pathMatchers("/api/v1/books/**").permitAll()
                
                // 5. 決済APIも「許可」
                .pathMatchers("/api/v1/checkout/**").permitAll()
                
                // ★★★ 追加: これがないと会員ステータスが見れません！ ★★★
                .pathMatchers("/api/v1/billing/**").permitAll()
                
                // それ以外は認証必要（念の為の蓋）
                .anyExchange().authenticated()
            )
            .build();
    }

    // CORS設定
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // 許可するフロントエンドのURL
        configuration.setAllowedOrigins(List.of(
            "http://localhost:5173", 
            "http://localhost:3000", 
            "http://smartbrief.jp", 
            "https://smartbrief.jp"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    // パスワードハッシュ化用
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}