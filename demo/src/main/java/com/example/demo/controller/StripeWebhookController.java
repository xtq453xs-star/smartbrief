package com.example.demo.controller;

import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.User;
import com.example.demo.service.BillingService;
import com.stripe.exception.EventDataObjectDeserializationException; // ★追加
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

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
        
        log.info("★★★ [Webhook] Endpoint Secret Check: {}", 
                endpointSecret == null ? "NULL!!!" : "SET (Length: " + endpointSecret.length() + ")");

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
                    log.info("★ [Webhook] Received payload. Length: {}", payload.length());

                    String sigHeader = request.getHeaders().getFirst("Stripe-Signature");
                    Event event;

                    try {
                        event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
                        log.info("★ [Webhook] Signature Verified. Event Type: {}", event.getType());
                    } catch (Exception e) {
                        log.error("★ [Webhook] Signature verification failed!", e);
                        return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Webhook Error"));
                    }

                    if ("checkout.session.completed".equals(event.getType())) {
                        log.info("★ [Webhook] Deserializing session object...");
                        
                        Session session = null;
                        try {
                            // ★修正ポイント: try-catch で囲みました！
                            session = (Session) event.getDataObjectDeserializer().deserializeUnsafe();
                        } catch (EventDataObjectDeserializationException e) {
                            // 万が一失敗したらログを出して終了
                            log.error("★ [Webhook] Deserialization Exception!", e);
                            return Mono.just(ResponseEntity.ok("Deserialization Error"));
                        }
                        
                        if (session != null) {
                            String username = session.getMetadata().get("userId");
                            log.info("★ [Webhook] SUCCESS! Metadata userId: {}", username);

                            if (username == null) {
                                log.warn("★ [Webhook] Username is NULL in metadata!");
                                return Mono.just(ResponseEntity.ok("Username missing"));
                            }
                            // .name() を削除し、Enum型をそのまま渡します
                            return billingService.updateSubscriptionFromWebhook(username, User.Plan.PREMIUM)
                                    .map(user -> {
                                        log.info("★ [Webhook] DB Updated for user: {}", user.getUsername());
                                        return ResponseEntity.ok("Success");
                                    });
                        } else {
                            log.error("★ [Webhook] Session is still NULL! (deserializeUnsafe failed)");
                        }
                    } else {
                        log.info("★ [Webhook] Ignored event type: {}", event.getType());
                    }

                    return Mono.just(ResponseEntity.ok("Ignored"));
                });
    }
}