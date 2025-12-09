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

    // --- 既存の getBillingStatus はそのままOK ---
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

    // --- ★修正版: Webhook用 (IDで検索する) ---
    /**
     * Webhook用: ユーザーのプランを更新する
     * @param userIdStr Webhookから渡されたユーザーID (String) ★変更
     * @param newPlan 新しいプラン
     * @return 更新されたユーザー
     */
    @Transactional
    public Mono<User> updateSubscriptionFromWebhook(String userIdStr, User.Plan newPlan) { // 引数名を変更して分かりやすく
        
        long userId;
        try {
            userId = Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            log.error("★ [BillingService] User ID is not a number: {}", userIdStr);
            return Mono.empty();
        }

        // ★修正: findByUsername ではなく findById を使う
        return userRepository.findById(userId) 
                .switchIfEmpty(Mono.error(new RuntimeException("User not found for webhook: ID=" + userId)))
                .flatMap(user -> {
                    // プラン名をセット (Enum -> String)
                    user.setPlanType(newPlan.name());

                    if (newPlan == User.Plan.PREMIUM) {
                        // ★ロジック: 残り期間を考慮して延長する
                        LocalDateTime now = LocalDateTime.now();
                        LocalDateTime currentExpiry = user.getSubscriptionExpiresAt();

                        if (currentExpiry != null && currentExpiry.isAfter(now)) {
                            // まだ期限が残っているなら、その期限 + 1ヶ月
                            user.setSubscriptionExpiresAt(currentExpiry.plusMonths(1));
                            log.info("Extending subscription for user: {} from {} to {}", 
                                    user.getUsername(), currentExpiry, user.getSubscriptionExpiresAt());
                        } else {
                            // 期限切れ、または初回なら、現在時刻 + 1ヶ月
                            user.setSubscriptionExpiresAt(now.plusMonths(1));
                            log.info("Starting new subscription for user: {}", user.getUsername());
                        }
                    } else {
                        // 解約時など
                        user.setSubscriptionExpiresAt(null);
                    }

                    log.info("Updating subscription for user: {}, plan: {}", user.getUsername(), newPlan);
                    return userRepository.save(user);
                });
    }
}