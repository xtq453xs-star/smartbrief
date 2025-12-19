package jp.smartbrief.billing.payment.controller;

import java.util.Map;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import jp.smartbrief.billing.identity.service.UserContextService;
import jp.smartbrief.billing.payment.dto.BillingStatusDto;
import jp.smartbrief.billing.payment.service.BillingService;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

/**
 * 課金・請求 API コントローラー
 * Stripe を利用した課金管理機能を提供します。
 * UserContextService を利用して認証と課金判定を一元化しました。
 */
@RestController
@RequestMapping("/api/v1/billing")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "https://smartbrief.jp"})
public class BillingController {

    private final BillingService billingService;
    private final UserContextService userContextService;

    // --- ステータス確認API ---
    @GetMapping("/status")
    public Mono<BillingStatusDto> getMyBillingStatus(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        return userContextService.resolveUserContext(authHeader)
            .flatMap(context -> {
                if (!context.isAuthenticated()) {
                    return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "ログインしてください"));
                }
                // BillingService に解決済みの username を渡す
                return billingService.getBillingStatus(Objects.requireNonNull(context.username()));
            });
    }

    // --- カスタマーポータルURL発行API ---
    @PostMapping("/portal")
    public Mono<ResponseEntity<Map<String, String>>> createPortalSession(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        return userContextService.resolveUserContext(authHeader)
            .flatMap(context -> {
                if (!context.isAuthenticated()) {
                    return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "ログインしてください"));
                }
                
                // 内部のUserエンティティからStripe顧客IDを取得してポータル作成
                return billingService.createPortalSession(Objects.requireNonNull(context.rawUser()))
                    .map(url -> ResponseEntity.ok(Map.of("portalUrl", url)));
            });
    }
}