package com.example.demo.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.repository.UserRepository;
import com.example.demo.util.JwtUtil;
import com.stripe.Stripe;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

/**
 * チェックアウト API コントローラー
 * 
 * Stripe チェックアウトセッションの作成を担当します。
 * ユーザーの購読プランの決済処理をサポートします。
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/checkout")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "https://smartbrief.jp"}) 
public class CheckoutController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Value("${stripe.api-key}")
    private String stripeApiKey;

    private static final String PREMIUM_PRICE_ID = "price_1SbMi91XIhlvdbUYQHehYanJ"; 

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
        String maskedKey = (stripeApiKey != null && stripeApiKey.length() > 4) 
                ? "..." + stripeApiKey.substring(stripeApiKey.length() - 4) 
                : "null";
        log.info("★ Stripe Init: Version={}, Key ends with={}", Stripe.VERSION, maskedKey);
    }

    @PostMapping("/create-session")
    public Mono<ResponseEntity<Map<String, String>>> createCheckoutSession(
            @RequestHeader(value = "Authorization", required = false) String authHeader) { 
        
        // 1. トークンがあるかチェック
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.error("★ [Checkout] No token provided.");
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "ログインしてください"));
        }

        // 2. トークンからユーザー名を抽出
        String token = authHeader.substring(7);
        String username;
        try {
            username = jwtUtil.extractUsername(token);
        } catch (Exception e) {
            log.error("★ [Checkout] Invalid token.");
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "無効なトークンです"));
        }

        // 3. DBからユーザーを検索して、Stripeセッションを作る
        return userRepository.findByUsername(username)
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "ユーザーが見つかりません")))
            .flatMap(user -> {
                log.info("★ [Checkout] Request for User: {} (ID: {})", user.getUsername(), user.getId());

                return Mono.fromCallable(() -> {
                    // ★修正: 本番ドメインに戻す (トークン維持のため)
                    // (必要に応じて /payment/success などを作るか、トップに戻す)
                	String successUrl = "https://smartbrief.jp/payment/success?session_id={CHECKOUT_SESSION_ID}";
                    String cancelUrl = "https://smartbrief.jp?canceled=true";
                    
                    SessionCreateParams params = SessionCreateParams.builder()
                            .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                            .addLineItem(SessionCreateParams.LineItem.builder()
                                    .setPrice(PREMIUM_PRICE_ID)
                                    .setQuantity(1L)
                                    .build())
                            .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                            .setSuccessUrl(successUrl)
                            .setCancelUrl(cancelUrl)
                            // ★重要: Webhookで「誰が払ったか」を知るためにユーザーIDを入れる
                            // (userIdはLong型かもしれないのでString変換)
                            .putMetadata("userId", String.valueOf(user.getId())) 
                            .build();

                    log.info("★ [Checkout] Sending request to Stripe...");
                    Session session = Session.create(params);
                    log.info("★ [Checkout] Session Created! ID: {}", session.getId());
                    
                    return session;
                })
                .subscribeOn(Schedulers.boundedElastic())
                .map(session -> ResponseEntity.ok(Map.of("checkoutUrl", session.getUrl())));
            })
            .doOnError(e -> log.error("★ [Checkout] Error: ", e));
    }
}