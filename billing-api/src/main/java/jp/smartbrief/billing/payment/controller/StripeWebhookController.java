package jp.smartbrief.billing.payment.controller;

import java.nio.charset.StandardCharsets;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jp.smartbrief.billing.identity.domain.User;
import jp.smartbrief.billing.payment.service.BillingService;

import com.stripe.exception.EventDataObjectDeserializationException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * Stripe ウェブフック コントローラー
 * 
 * Stripe からの webhook イベントを受信・処理します。
 * 主にチェックアウトセッション完了イベントを処理し、
 * ユーザーの購読情報をデータベースに保存します。
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/webhook")
@RequiredArgsConstructor
public class StripeWebhookController {

    @Value("${stripe.webhook-secret}")
    private String endpointSecret;

    private final BillingService billingService;

    @PostMapping
    public Mono<ResponseEntity<String>> handleStripeWebhook(ServerHttpRequest request) {
        
        return DataBufferUtils.join(request.getBody())
            .map(dataBuffer -> {
                try {
                    byte[] bytes = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(bytes);
                    return new String(bytes, StandardCharsets.UTF_8);
                } finally {
                    DataBufferUtils.release(dataBuffer);
                }
            })
            .flatMap(payload -> {
                String sigHeader = request.getHeaders().getFirst("Stripe-Signature");
                
                // 署名ヘッダーの存在チェック
                if (sigHeader == null) {
                    log.error("★ [Webhook] Missing Stripe-Signature header");
                    return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Missing Signature"));
                }

                Event event;
                try {
                    // 署名の検証
                    event = Webhook.constructEvent(payload, sigHeader, Objects.requireNonNull(endpointSecret));
                    log.info("★ [Webhook] Signature Verified. Type: {}", event.getType());
                } catch (Exception e) {
                    log.error("★ [Webhook] Signature verification failed!", e);
                    return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid Signature"));
                }

                // 決済完了イベントの処理
                if ("checkout.session.completed".equals(event.getType())) {
                    try {
                        Session session = (Session) event.getDataObjectDeserializer().deserializeUnsafe();
                        if (session != null) {
                            // metadata から userId を抽出 (CheckoutController でセットしたもの)
                            String userIdStr = session.getMetadata() != null ? session.getMetadata().get("userId") : null;
                            String customerId = session.getCustomer();

                            if (userIdStr == null) {
                                log.warn("★ [Webhook] userId not found in session metadata");
                                return Mono.just(ResponseEntity.ok("User ID missing"));
                            }

                            log.info("★ [Webhook] SUCCESS! UserID: {}, CustomerID: {}", userIdStr, customerId);

                            // BillingService に委譲して DB を更新
                            return billingService.updateSubscriptionFromWebhook(userIdStr, User.Plan.PREMIUM, customerId)
                                .map(user -> {
                                    log.info("★ [Webhook] DB Updated for user: {}", user.getUsername());
                                    return ResponseEntity.ok("Success");
                                })
                                .defaultIfEmpty(ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found"));
                        }
                    } catch (EventDataObjectDeserializationException e) {
                        log.error("★ [Webhook] Deserialization failed", e);
                        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Deserialization Error"));
                    }
                }

                // その他のイベントは正常応答だけ返して無視
                return Mono.just(ResponseEntity.ok("Event received and ignored"));
            });
    }
}