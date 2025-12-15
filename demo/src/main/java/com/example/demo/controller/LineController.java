package com.example.demo.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.User;
import com.example.demo.domain.UserBookHistory;
import com.example.demo.domain.Work;
import com.example.demo.dto.BookResponse;
import com.example.demo.repository.UserBookHistoryRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.WorkRepository;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/line")
@RequiredArgsConstructor
public class LineController {

    private final UserRepository userRepository;
    private final WorkRepository workRepository;
    private final UserBookHistoryRepository historyRepository;
    private final PasswordEncoder passwordEncoder;

    // --- 1. アカウント連携API ---
    @PostMapping("/link")
    @Transactional
    public Mono<ResponseEntity<Map<String, String>>> linkAccount(@RequestBody LinkRequest request) {
        return userRepository.findByUsername(request.getUsername())
                .filter(user -> passwordEncoder.matches(request.getPassword(), user.getPassword()))
                .flatMap(user -> {
                    user.setLineUserId(request.getLineUserId());
                    return userRepository.save(user)
                            .map(saved -> ResponseEntity.ok(Map.of("message", "連携に成功しました！\nWebのプレミアム機能がLINEでも有効になります。")));
                })
                .defaultIfEmpty(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "IDまたはパスワードが間違っています。")));
    }

    // --- 2. 閲覧API (LINE用) ---
    @PostMapping("/read")
    @Transactional
    public Mono<ResponseEntity<Object>> readBook(@RequestBody ReadRequest request) {
        return userRepository.findByLineUserId(request.getLineUserId())
                .switchIfEmpty(Mono.error(new RuntimeException("NOT_LINKED")))
                .flatMap(user -> {
                    return workRepository.findById(request.getBookId())
                        .flatMap(work -> {
                            // プレミアム判定
                            boolean isPremium = "PREMIUM".equalsIgnoreCase(user.getPlanType())
                                    && user.getSubscriptionExpiresAt() != null
                                    && user.getSubscriptionExpiresAt().isAfter(LocalDateTime.now());

                            if (isPremium) {
                                // プレミアム会員: 制限なし
                                return recordHistoryAndResponse(user, work, true);
                            } else {
                                // 無料会員: 1日3回制限チェック
                                LocalDateTime todayStart = LocalDate.now().atStartOfDay();
                                return historyRepository.countByUserIdAndViewedAtAfter(user.getId(), todayStart)
                                    .flatMap(count -> {
                                        if (count >= 3) {
                                            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN)
                                                    .body((Object)Map.of("message", "無料プランの1日の閲覧制限（3回）に達しました。\n\nWebでプレミアムプランに登録すると無制限で読めます！\n👇\nhttps://smartbrief.jp")));
                                        }
                                        // 制限内
                                        return recordHistoryAndResponse(user, work, false);
                                    });
                            }
                        });
                })
                .onErrorResume(e -> {
                    if ("NOT_LINKED".equals(e.getMessage())) {
                        return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .body(Map.of("message", "アカウントが連携されていません。\nメニューの「連携する」からログイン情報を入力してください。")));
                    }
                    return Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Map.of("message", "作品が見つかりません。")));
                });
    }

 // ★改良: 重複履歴の防止ロジックを追加
    private Mono<ResponseEntity<Object>> recordHistoryAndResponse(User user, Work work, boolean isPremium) {
        // 直近の履歴を取得し、1分以内なら「保存せずに」レスポンスだけ返す
        return historyRepository.findFirstByUserIdAndBookIdOrderByViewedAtDesc(user.getId(), work.getId())
                .flatMap(latestHistory -> {
                    // 直近1分以内に見た履歴がある場合
                    if (latestHistory.getViewedAt().isAfter(LocalDateTime.now().minusMinutes(1))) {
                        // DB保存をスキップして結果だけ返す
                        // ★修正点: (Object) キャストを追加して ResponseEntity<Object> 型に合わせる
                        return Mono.just(ResponseEntity.ok((Object) BookResponse.from(work, isPremium)));
                    }
                    // 1分以上前なら新規保存
                    return saveNewHistory(user, work, isPremium);
                })
                // 履歴が一件もない場合も新規保存
                .switchIfEmpty(saveNewHistory(user, work, isPremium));
    }

    // 履歴保存の共通メソッド
    private Mono<ResponseEntity<Object>> saveNewHistory(User user, Work work, boolean isPremium) {
        UserBookHistory history = new UserBookHistory();
        history.setUserId(user.getId());
        history.setBookId(work.getId());
        history.setBookTitle(work.getTitle());
        history.setAuthorName(work.getAuthorName());
        history.setViewedAt(LocalDateTime.now());

        return historyRepository.save(history)
                // ★修正点: こちらも念のため (Object) キャストを入れて型を統一
                .map(saved -> ResponseEntity.ok((Object) BookResponse.from(work, isPremium)));
    }
    @Data
    static class LinkRequest {
        private String username;
        private String password;
        private String lineUserId;
    }

    @Data
    static class ReadRequest {
        private String lineUserId;
        private Integer bookId;
    }
}