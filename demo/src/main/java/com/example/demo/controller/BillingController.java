package com.example.demo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader; // ★追加
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.BillingStatusDto;
import com.example.demo.service.BillingService;
import com.example.demo.util.JwtUtil; // ★追加

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@RestController
// ★ URLを他のコントローラーと統一感を持たせるため、ここを /api/v1/billing に変更推奨
@RequestMapping("/api/v1/billing") 
@RequiredArgsConstructor
// ★ フロントエンド(5173)からのアクセスを許可
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "https://smartbrief.jp"}) 
public class BillingController {

    private final BillingService billingService;
    private final JwtUtil jwtUtil; // ★トークン解析用に追加

    // URL: /api/v1/billing/status
    @GetMapping("/status")
    public Mono<BillingStatusDto> getMyBillingStatus(
            @RequestHeader(value = "Authorization", required = false) String authHeader) { // ★修正: ヘッダーから取得

        // 1. トークンがあるかチェック
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "ログインしてください"));
        }

        // 2. トークン解析
        String token = authHeader.substring(7);
        String username;
        try {
            username = jwtUtil.extractUsername(token);
        } catch (Exception e) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "無効なトークンです"));
        }

        // 3. サービス呼び出し
        return billingService.getBillingStatus(username);
    }
}