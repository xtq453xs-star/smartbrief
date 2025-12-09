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

    // --- 1. アカウント連携API (修正版: JSONを返す) ---
    @PostMapping("/link")
    @Transactional
    public Mono<ResponseEntity<Map<String, String>>> linkAccount(@RequestBody LinkRequest request) {
        return userRepository.findByUsername(request.getUsername())
                .filter(user -> passwordEncoder.matches(request.getPassword(), user.getPassword()))
                .flatMap(user -> {
                    // LINE ID を保存
                    user.setLineUserId(request.getLineUserId());
                    return userRepository.save(user)
                            // ★修正: JSON形式で返す
                            .map(saved -> ResponseEntity.ok(Map.of("message", "連携に成功しました！\nWebの課金状況がLINEに反映されます。")));
                })
                // ★修正: エラー時もJSON形式で返す
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
                            boolean isPremium = "PREMIUM".equalsIgnoreCase(user.getPlanType());

                            if (isPremium) {
                                return recordHistoryAndResponse(user, work);
                            } else {
                                LocalDateTime todayStart = LocalDate.now().atStartOfDay();
                                return historyRepository.countByUserIdAndViewedAtAfter(user.getId(), todayStart)
                                    .flatMap(count -> {
                                        if (count >= 3) {
                                            // ★修正: メッセージをJSONで返す
                                            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN)
                                                    .body((Object)Map.of("message", "無料プランの1日の閲覧制限（3回）に達しました。\nWebでプレミアムプランに登録すると無制限で読めます！")));
                                        }
                                        return recordHistoryAndResponse(user, work);
                                    });
                            }
                        });
                })
                .onErrorResume(e -> {
                    if ("NOT_LINKED".equals(e.getMessage())) {
                        return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .body(Map.of("message", "アカウントが連携されていません。\nメニューの「連携する」から設定してください。")));
                    }
                    return Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Map.of("message", "作品が見つかりません。")));
                });
    }

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