package jp.smartbrief.billing.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jp.smartbrief.billing.dto.BillingStatusDto;
import jp.smartbrief.billing.repository.UserRepository;
import jp.smartbrief.billing.service.BillingService;
import jp.smartbrief.billing.util.JwtUtil;
import com.stripe.Stripe;
import com.stripe.model.billingportal.Session;
import com.stripe.param.billingportal.SessionCreateParams;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

/**
 * 課金・請求 API コントローラー
 * 
 * Stripe を利用した課金管理機能を提供します。
 * ユーザーの課金ステータス確認、顧客ポータルの作成などを行います。
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/billing")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "https://smartbrief.jp"})
public class BillingController {

    private final BillingService billingService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Value("${stripe.api-key}")
    private String stripeApiKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }

    // --- ステータス確認API ---
    @GetMapping("/status")
    public Mono<BillingStatusDto> getMyBillingStatus(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "ログインしてください"));
        }

        String token = authHeader.substring(7);
        String username;
        try {
            username = jwtUtil.extractUsername(token);
        } catch (Exception e) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "無効なトークンです"));
        }

        return billingService.getBillingStatus(username);
    }

    // --- カスタマーポータルURL発行API ---
    @PostMapping("/portal")
    public Mono<ResponseEntity<Map<String, String>>> createPortalSession(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        // 1. トークンチェック
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "ログインしてください"));
        }
        String token = authHeader.substring(7);
        String username;
        try {
            username = jwtUtil.extractUsername(token);
        } catch (Exception e) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "無効なトークンです"));
        }

        // 2. ユーザー検索
        return userRepository.findByUsername(username)
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "ユーザーが見つかりません")))
            .flatMap(user -> {
                String customerId = user.getStripeCustomerId();
                
                if (customerId == null || customerId.isEmpty()) {
                    // ★追加: ログ出力
                    log.warn("User {} tried to access portal but has no customer ID.", username);
                    return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "課金履歴がありません"));
                }

                // ★追加: ログ出力
                log.info("Creating portal session for user: {}, customer: {}", username, customerId);

                // 3. Stripeポータルセッション作成
                return Mono.fromCallable(() -> {
                    SessionCreateParams params = SessionCreateParams.builder()
                            .setCustomer(customerId)
                            .setReturnUrl("https://smartbrief.jp") 
                            .build();

                    return Session.create(params);
                })
                .subscribeOn(Schedulers.boundedElastic())
                .map(session -> {
                    // ★追加: 成功ログ
                    log.info("Portal session created: {}", session.getUrl());
                    return ResponseEntity.ok(Map.of("portalUrl", session.getUrl()));
                });
            });
    }
}