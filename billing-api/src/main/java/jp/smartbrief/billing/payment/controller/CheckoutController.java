package jp.smartbrief.billing.payment.controller;

import java.util.Map;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jp.smartbrief.billing.identity.domain.User;
import jp.smartbrief.billing.payment.service.BillingService;
import jp.smartbrief.billing.shared.dto.UserContext;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

/**
 * 決済チェックアウト API
 * * 責務: ユーザーを有料プラン登録画面（Stripe）へ誘導する
 */
@RestController
@RequestMapping("/api/v1/checkout")
@RequiredArgsConstructor
public class CheckoutController {

    private final BillingService billingService;

    @PostMapping("/create-session")
    public Mono<ResponseEntity<Map<String, String>>> createCheckoutSession(
            @AuthenticationPrincipal User user,
            @RequestBody(required = false) CheckoutRequest request) {

        // 1. コンテキスト解決
        UserContext context = UserContext.from(user);
        
        // 2. 認証ガード (Fail-Fast)
        if (!context.isAuthenticated()) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "ログインが必要です"));
        }

        // 3. ビジネスルールガード
        // 既にプレミアム会員のユーザーに、重ねて決済させない（二重課金防止 & UX向上）
        if (context.isPremium()) {
             return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "すでにプレミアムプランに登録済みです"));
        }

        // 4. 処理実行 (Happy Path)
        // UserContextから取得するID/Usernameは、認証済みであればnullでない前提だが、requireNonNullで堅牢にする
        return billingService.createCheckoutSession(
                Objects.requireNonNull(context.userId()), 
                Objects.requireNonNull(context.username())
            )
            .map(url -> ResponseEntity.ok(Map.of("url", Objects.requireNonNull(url))));
    }

    @Data
    static class CheckoutRequest {
        private String priceId; // 将来の拡張用
    }
}