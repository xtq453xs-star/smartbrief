package jp.smartbrief.billing.payment.controller;

import java.util.Map;
import java.util.Objects; // ★使うので残します

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import jp.smartbrief.billing.identity.service.UserContextService;
// ★ BillingService は使っていないので削除しました
import com.stripe.Stripe;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
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

    private final UserContextService userContextService;

    @Value("${stripe.api-key}")
    private String stripeApiKey;

    private static final String PREMIUM_PRICE_ID = "price_1SbMi91XIhlvdbUYQHehYanJ"; 

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }

    @PostMapping("/create-session")
    public Mono<ResponseEntity<Map<String, String>>> createCheckoutSession(
            @RequestHeader(value = "Authorization", required = false) String authHeader) { 
        
        return userContextService.resolveUserContext(authHeader)
            .flatMap(context -> {
                if (!context.isAuthenticated()) {
                    return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "ログインしてください"));
                }

                // ★ Mono.<Session> と型を明示して安全性を高めます
                return Mono.<Session>fromCallable(() -> {
                    String successUrl = "https://smartbrief.jp/payment/success?session_id={CHECKOUT_SESSION_ID}";
                    String cancelUrl = "https://smartbrief.jp?canceled=true";
                    
                    // Metadata に入れる ID も Null ガード
                    String userIdStr = String.valueOf(Objects.requireNonNull(context.userId()));

                    SessionCreateParams params = SessionCreateParams.builder()
                            .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                            .addLineItem(SessionCreateParams.LineItem.builder()
                                    .setPrice(PREMIUM_PRICE_ID)
                                    .setQuantity(1L)
                                    .build())
                            .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                            .setSuccessUrl(successUrl)
                            .setCancelUrl(cancelUrl)
                            .putMetadata("userId", userIdStr) 
                            .build();

                    return Session.create(params);
                })
                .subscribeOn(Schedulers.boundedElastic())
                .map(session -> {
                    // ★ session.getUrl() が Null にならないことを保証
                    String url = Objects.requireNonNull(session.getUrl());
                    return ResponseEntity.ok(Map.of("checkoutUrl", url));
                });
            });
    }
}