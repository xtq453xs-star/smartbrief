package com.example.demo.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.domain.User;
import com.example.demo.dto.BillingStatusDto;
import com.example.demo.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class BillingService {

    private final UserRepository userRepository;

    // --- 既存の getBillingStatus (変更なし) ---
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

    // --- ★修正箇所: 引数を3つに増やしました！ ---
    /**
     * Webhook用: ユーザーのプランを更新する
     * @param userIdStr Webhookから渡されたユーザーID (String)
     * @param newPlan 新しいプラン
     * @param stripeCustomerId Stripeの顧客ID (cus_...) ★追加！
     * @return 更新されたユーザー
     */
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
                    
                    // ★追加: Stripe顧客IDを保存する処理
                    if (stripeCustomerId != null && !stripeCustomerId.isEmpty()) {
                        user.setStripeCustomerId(stripeCustomerId);
                        log.info("Linked Stripe Customer ID: {} to User: {}", stripeCustomerId, user.getUsername());
                    }

                 // 期限延長ロジック (修正版)
                    if (newPlan == User.Plan.PREMIUM) {
                        LocalDateTime now = LocalDateTime.now();
                        
                        // ❌ 修正前: 既存の期限に足していた（重複の原因）
                        // LocalDateTime currentExpiry = user.getSubscriptionExpiresAt();
                        // if (currentExpiry != null && currentExpiry.isAfter(now)) {
                        //     user.setSubscriptionExpiresAt(currentExpiry.plusMonths(1));
                        // } else {
                        //     user.setSubscriptionExpiresAt(now.plusMonths(1));
                        // }

                        // ⭕ 修正後: 常に「現在から1ヶ月後」に上書きする（何度来ても同じ結果になる）
                        // ※Stripeの定期課金は決済成功のたびにWebhookが飛んでくるので、これで毎月更新されます
                        user.setSubscriptionExpiresAt(now.plusMonths(1));
                        
                        log.info("Set subscription expiry for user: {} to {}", user.getUsername(), user.getSubscriptionExpiresAt());
                    } else {
                    	user.setSubscriptionExpiresAt(null);
                    }

                    log.info("Updating subscription for user: {}, plan: {}", user.getUsername(), newPlan);
                    return userRepository.save(user);
                });
    }
}