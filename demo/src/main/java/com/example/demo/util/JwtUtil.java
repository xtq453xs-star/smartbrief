package com.example.demo.util;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    // application.yml で設定する秘密鍵（後述）
	@Value("${JWT_SECRET_KEY}")
    private String secret;

    // トークンの有効期限（例: 24時間）
	@Value("${JWT_EXPIRATION}")
    private long expirationTime;

    private SecretKey getSignInKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    // 1. トークンからユーザー名を取得
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // 2. トークンの有効期限を確認
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Boolean isTokenExpired(String token) {
        // トークンから取得した期限が現在時刻より前か確認
        return extractExpiration(token).before(new Date());
    }

    // 3. トークンを生成する（ログイン成功時に呼ぶ）
    public String generateToken(String username) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, username);
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime)) 
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // 4. トークンの検証（リクエストが来るたびに呼ぶ - ユーザー名チェックも行う）
    public Boolean validateToken(String token, String username) {
        final String extractedUsername = extractUsername(token);
        return (extractedUsername.equals(username) && !isTokenExpired(token));
    }
    
    // ★★★ 追加するメソッド ★★★
    // 5. トークンの署名と有効期限のみを検証するメソッド (SecurityConfigで使用)
    public Boolean validateToken(String token) {
        try {
            // 署名検証と期限切れチェックを行う
            Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            // 署名エラーや期限切れエラーが発生した場合は false
            return false;
        }
    }
}