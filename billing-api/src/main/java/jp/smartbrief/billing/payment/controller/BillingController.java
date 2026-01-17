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
import jp.smartbrief.billing.payment.dto.BillingStatusDto; // ★追加
import jp.smartbrief.billing.payment.service.BillingService;
import jp.smartbrief.billing.shared.dto.UserContext;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

/**
 * 課金ポータル API
 */
@RestController
@RequestMapping("/api/v1/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    // ★★★ このメソッドが欠落していたため、追加します ★★★
    @GetMapping("/status")
    public Mono<ResponseEntity<BillingStatusDto>> getBillingStatus(@AuthenticationPrincipal User user) {
        UserContext context = UserContext.from(user);

        if (!context.isAuthenticated()) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "ログインしてください"));
        }

        // Serviceにある既存のメソッドを呼び出す
        return billingService.getBillingStatus(context.username())
            .map(ResponseEntity::ok);
    }
    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

    @GetMapping("/portal")
    public Mono<ResponseEntity<Map<String, String>>> createPortalSession(@AuthenticationPrincipal User user) {
        UserContext context = UserContext.from(user);

        if (!context.isAuthenticated()) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "ログインしてください"));
        }

        String customerId = context.rawUser().getStripeCustomerId();
        if (customerId == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "有料プランの登録情報が見つかりません"));
        }

        return billingService.createPortalSession(customerId)
            .map(url -> ResponseEntity.ok(Map.of("url", Objects.requireNonNull(url))));
    }
}