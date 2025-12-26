package jp.smartbrief.billing.payment.controller;

import java.util.Map;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jp.smartbrief.billing.identity.domain.User;
import jp.smartbrief.billing.payment.service.BillingService;
import jp.smartbrief.billing.shared.dto.UserContext;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

/**
 * 課金ポータル API
 * * 責務: 既存の課金ユーザーを、解約・カード変更画面（Stripe Portal）へ誘導する
 */
@RestController
@RequestMapping("/api/v1/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @GetMapping("/portal")
    public Mono<ResponseEntity<Map<String, String>>> createPortalSession(@AuthenticationPrincipal User user) {
        UserContext context = UserContext.from(user);

        // 1. 認証ガード (Fail-Fast)
        if (!context.isAuthenticated()) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "ログインしてください"));
        }

        // 2. 状態ガード
        // StripeCustomerIdを持たない（＝課金実績がない）ユーザーはポータルを開けない
        String customerId = context.rawUser().getStripeCustomerId();
        if (customerId == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "有料プランの登録情報が見つかりません"));
        }

        // 3. 処理実行 (Happy Path)
        return billingService.createPortalSession(customerId)
            .map(url -> ResponseEntity.ok(Map.of("url", Objects.requireNonNull(url))));
    }
}