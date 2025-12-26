package jp.smartbrief.billing.payment.service;

import java.time.LocalDateTime;

import jakarta.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.stripe.Stripe;
import com.stripe.model.billingportal.Session;
import com.stripe.param.billingportal.SessionCreateParams;
import com.stripe.param.checkout.SessionCreateParams.LineItem;

import jp.smartbrief.billing.identity.domain.User;
import jp.smartbrief.billing.identity.repository.UserRepository;
import jp.smartbrief.billing.payment.dto.BillingStatusDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

/**
 * 課金ドメインサービス
 * * 責務:
 * 1. 課金ステータスの参照
 * 2. Stripe API との通信（Checkout/Portal）- ※ブロッキング処理の隔離
 * 3. Webhook によるステータス更新 - ※トランザクション管理
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BillingService {

    private final UserRepository userRepository;

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${stripe.price.id:price_H5ggYJDqBoLV53}") 
    private String premiumPriceId;

    /**
     * アプリ起動時にStripe APIキーを初期化
     */
    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }

    // --- 1. 参照系ロジック ---

    /**
     * ユーザーの現在の課金ステータスを取得
     */
    public Mono<BillingStatusDto> getBillingStatus(String username) {
        return userRepository.findByUsername(username)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")))
                .map(this::mapToStatusDto);
    }

    // --- 2. Stripe連携ロジック (Bounded Elastic Scheduler利用) ---

    /**
     * 決済セッション作成 (Checkout)
     * Stripe SDKはブロッキングI/Oを行うため、専用スレッドで実行してイベントループを守る
     */
    public Mono<String> createCheckoutSession(Long userId, String email) {
        return Mono.fromCallable(() -> {
            com.stripe.param.checkout.SessionCreateParams params = com.stripe.param.checkout.SessionCreateParams.builder()
                .setMode(com.stripe.param.checkout.SessionCreateParams.Mode.SUBSCRIPTION)
                .setCustomerEmail(email)
                .setSuccessUrl(frontendUrl + "/settings?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(frontendUrl + "/pricing")
                .addLineItem(
                    LineItem.builder()
                        .setQuantity(1L)
                        .setPrice(premiumPriceId)
                        .build()
                )
                .putMetadata("userId", String.valueOf(userId)) // Webhookでの突き合わせ用
                .build();

            return com.stripe.model.checkout.Session.create(params).getUrl();
        })
        .subscribeOn(Schedulers.boundedElastic()); // ★重要: ノンブロッキングを維持
    }

    /**
     * カスタマーポータルURL発行 (Portal)
     */
    public Mono<String> createPortalSession(String customerId) {
        // ガード節: IDがない場合はStripeを呼ばずにエラー
        if (customerId == null || customerId.isEmpty()) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "課金履歴が見つかりません"));
        }

        return Mono.fromCallable(() -> {
            SessionCreateParams params = SessionCreateParams.builder()
                    .setCustomer(customerId)
                    .setReturnUrl(frontendUrl + "/settings")
                    .build();

            return Session.create(params).getUrl();
        })
        .subscribeOn(Schedulers.boundedElastic());
    }

    // --- 3. 更新系ロジック (Transactional) ---

    /**
     * Webhookからの通知を受けてプランを更新
     */
    @Transactional
    public Mono<User> updateSubscriptionFromWebhook(String userIdStr, User.Plan newPlan, String stripeCustomerId) {
        long userId;
        try {
            userId = Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            log.warn("Webhook ignored: Invalid userId format '{}'", userIdStr);
            return Mono.empty(); // エラーにせず無視（Stripeへの再送を防ぐため200OK扱いにすることが多い）
        }

        return userRepository.findById(userId)
                .switchIfEmpty(Mono.defer(() -> {
                    log.error("Webhook error: User not found ID={}", userId);
                    return Mono.empty();
                }))
                .flatMap(user -> {
                    // ドメインロジック: プラン変更に伴う有効期限の設定
                    updateUserPlan(user, newPlan, stripeCustomerId);
                    log.info("Subscription updated: UserID={}, Plan={}", user.getId(), newPlan);
                    return userRepository.save(user);
                });
    }

    // --- Private Helper Methods ---

    private BillingStatusDto mapToStatusDto(User user) {
        boolean isPremium = User.Plan.PREMIUM.name().equals(user.getPlanType())
                && (user.getSubscriptionExpiresAt() == null || user.getSubscriptionExpiresAt().isAfter(LocalDateTime.now()));

        return new BillingStatusDto(
                user.getUsername(),
                user.getPlanType(),
                isPremium,
                user.getSubscriptionExpiresAt() != null ? user.getSubscriptionExpiresAt().toString() : "N/A"
        );
    }

    private void updateUserPlan(User user, User.Plan newPlan, String stripeCustomerId) {
        user.setPlanType(newPlan.name());
        
        if (stripeCustomerId != null && !stripeCustomerId.isEmpty()) {
            user.setStripeCustomerId(stripeCustomerId);
        }

        if (newPlan == User.Plan.PREMIUM) {
            // 自動更新前提でとりあえず1ヶ月後とする（実際はWebhookの都度更新される）
            user.setSubscriptionExpiresAt(LocalDateTime.now().plusMonths(1));
        } else {
            user.setSubscriptionExpiresAt(null);
        }
    }
}