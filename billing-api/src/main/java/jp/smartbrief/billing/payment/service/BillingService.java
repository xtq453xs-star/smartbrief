package jp.smartbrief.billing.payment.service;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import jp.smartbrief.billing.identity.domain.User;
import jp.smartbrief.billing.identity.repository.UserRepository;
import jp.smartbrief.billing.payment.dto.BillingStatusDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

// ★ Stripe 関連のインポートを以下に修正
import com.stripe.model.billingportal.Session;
import com.stripe.param.billingportal.SessionCreateParams; 

/**
 * 課金サービス
 * ユーザーの課金情報を管理し、Stripe 連携（ステータス、Webhook、ポータル発行）を行います。
 */

@Slf4j
@Service
@RequiredArgsConstructor
public class BillingService {

    private final UserRepository userRepository;

    // --- 1. ステータス取得 (変更なし) ---
    public Mono<BillingStatusDto> getBillingStatus(String username) {
        return userRepository.findByUsername(username)
                .switchIfEmpty(Mono.error(new RuntimeException("User not found")))
                .map(user -> {
                    boolean isPremium = User.Plan.PREMIUM.name().equals(user.getPlanType())
                            && (user.getSubscriptionExpiresAt() == null || user.getSubscriptionExpiresAt().isAfter(LocalDateTime.now()));

                    return new BillingStatusDto(
                            user.getUsername(),
                            user.getPlanType(),
                            isPremium,
                            user.getSubscriptionExpiresAt() != null ? user.getSubscriptionExpiresAt().toString() : "N/A"
                    );
                });
    }

    // --- 2. ★修正版: カスタマーポータルURL発行 ---
    public Mono<String> createPortalSession(User user) {
        // Mono.<String> と明示することで fromCallable の型エラーを防ぎます
        return Mono.<String>fromCallable(() -> {
            String customerId = user.getStripeCustomerId();
            if (customerId == null || customerId.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "課金履歴が見つかりません");
            }

            // ★修正: com.stripe.param パッケージのクラスを使用
            SessionCreateParams params = SessionCreateParams.builder()
                    .setCustomer(customerId)
                    .setReturnUrl("https://smartbrief.jp/setting")
                    .build();

            // com.stripe.model.billingportal.Session.create を呼び出し
            return Session.create(params).getUrl();
        })
        .subscribeOn(Schedulers.boundedElastic());
    }

    // --- 3. Webhook用: プラン更新 (変更なし) ---
    @Transactional
    public Mono<User> updateSubscriptionFromWebhook(String userIdStr, User.Plan newPlan, String stripeCustomerId) {
        long userId;
        try {
            userId = Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            log.error("★ [BillingService] User ID is not a number: {}", userIdStr);
            return Mono.empty();
        }

        return userRepository.findById(userId) 
                .switchIfEmpty(Mono.error(new RuntimeException("User not found for webhook: ID=" + userId)))
                .flatMap(user -> {
                    user.setPlanType(newPlan.name());
                    
                    if (stripeCustomerId != null && !stripeCustomerId.isEmpty()) {
                        user.setStripeCustomerId(stripeCustomerId);
                    }

                    if (newPlan == User.Plan.PREMIUM) {
                        user.setSubscriptionExpiresAt(LocalDateTime.now().plusMonths(1));
                    } else {
                        user.setSubscriptionExpiresAt(null);
                    }

                    return userRepository.save(user);
                });
    }
}