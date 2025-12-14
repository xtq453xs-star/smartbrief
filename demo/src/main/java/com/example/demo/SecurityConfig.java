package com.example.demo;

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

import com.example.demo.security.AuthenticationManager;
import com.example.demo.security.SecurityContextRepository;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;

    public SecurityConfig(AuthenticationManager authenticationManager, SecurityContextRepository securityContextRepository) {
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
            .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
            
            // 認証されていない場合の応答を 401 Unauthorized に設定
            .exceptionHandling(exceptionHandling -> exceptionHandling
                .authenticationEntryPoint(new HttpStatusServerEntryPoint(HttpStatus.UNAUTHORIZED))
            )

            // ★★★ 認証マネージャーとコンテキストリポジトリを適用 ★★★
            // この設定が、ヘッダーからトークンを読み取り、検証する処理をフィルターチェーンに組み込みます。
            .authenticationManager(authenticationManager)
            .securityContextRepository(securityContextRepository)
            // ★★★★★★★★★★★★★★★★★★★★★★★★★★★

            // CORS設定
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // 認証・認可ルールの定義
            .authorizeExchange(exchanges -> exchanges
                .pathMatchers(HttpMethod.OPTIONS).permitAll()
                
                // 1. /me は認証が必要（認証が必要なAPIは、permitAllより先に書く！）
                .pathMatchers("/api/v1/auth/me").authenticated()

                // 2. その他の auth 系（ログイン、登録、リセット）は許可
                .pathMatchers("/api/v1/auth/**").permitAll()
                
                // 3. Webhook/その他は許可
                .pathMatchers("/api/v1/webhook/**").permitAll()
                .pathMatchers("/api/v1/books/**").permitAll()
                .pathMatchers("/api/v1/checkout/**").permitAll()
                .pathMatchers("/api/v1/billing/**").permitAll()
                .pathMatchers("/api/v1/line/**").permitAll()
                
                // 最後に残ったもの（念のため）は認証が必要
                .anyExchange().authenticated()
            )
            .build();
    }

    // CORS設定はそのまま
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
            "http://localhost:5173", 
            "http://localhost:3000", 
            "https://smartbrief.jp"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}