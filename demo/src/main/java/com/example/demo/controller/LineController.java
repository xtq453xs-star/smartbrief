package com.example.demo.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;

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
    // n8nから「WebのID/PASS」と「LINE ID」を受け取り、紐付ける
    @PostMapping("/link")
    @Transactional
    public Mono<ResponseEntity<String>> linkAccount(@RequestBody LinkRequest request) {
        return userRepository.findByUsername(request.getUsername())
                .filter(user -> passwordEncoder.matches(request.getPassword(), user.getPassword()))
                .flatMap(user -> {
                    // LINE ID を保存
                    user.setLineUserId(request.getLineUserId());
                    return userRepository.save(user)
                            .map(saved -> ResponseEntity.ok("連携に成功しました！\nこれでWebの課金状況がLINEにも反映されます。"));
                })
                .defaultIfEmpty(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("IDまたはパスワードが間違っています。"));
    }

    // --- 2. 閲覧API (LINE用) ---
    // LINE ID と 作品ID を受け取り、要約を返す（回数制限チェック付き）
    @PostMapping("/read")
    @Transactional
    public Mono<ResponseEntity<Object>> readBook(@RequestBody ReadRequest request) {
        // LINE ID からユーザーを特定
        return userRepository.findByLineUserId(request.getLineUserId())
                .switchIfEmpty(Mono.error(new RuntimeException("NOT_LINKED"))) // 未連携の場合
                .flatMap(user -> {
                    // 作品を取得
                    return workRepository.findById(request.getBookId())
                        .flatMap(work -> {
                            // プレミアム判定
                            boolean isPremium = "PREMIUM".equalsIgnoreCase(user.getPlanType());

                            if (isPremium) {
                                // プレミアムなら無条件OK
                                return recordHistoryAndResponse(user, work);
                            } else {
                                // 無料会員: 今日の回数チェック
                                LocalDateTime todayStart = LocalDate.now().atStartOfDay();
                                return historyRepository.countByUserIdAndViewedAtAfter(user.getId(), todayStart)
                                    .flatMap(count -> {
                                        if (count >= 3) {
                                            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN)
                                                    .body((Object)"無料プランの1日の閲覧制限（3回）に達しました。\nWebでプレミアムプランに登録すると無制限で読めます！"));
                                        }
                                        return recordHistoryAndResponse(user, work);
                                    });
                            }
                        });
                })
                // エラーハンドリング
                .onErrorResume(e -> {
                    if ("NOT_LINKED".equals(e.getMessage())) {
                        return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .body("アカウントが連携されていません。\nメニューの「連携する」から設定してください。"));
                    }
                    return Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND).body("作品が見つかりません。"));
                });
    }

    // 履歴保存＆レスポンス生成
    private Mono<ResponseEntity<Object>> recordHistoryAndResponse(User user, Work work) {
        UserBookHistory history = new UserBookHistory();
        history.setUserId(user.getId());
        history.setBookId(work.getId());
        history.setBookTitle(work.getTitle());
        history.setAuthorName(work.getAuthorName());
        history.setViewedAt(LocalDateTime.now());

        return historyRepository.save(history)
                .thenReturn(ResponseEntity.ok(BookResponse.from(work)));
    }

    // --- DTO ---
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