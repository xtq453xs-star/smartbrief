package jp.smartbrief.billing.identity.controller;

import java.util.Map;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jp.smartbrief.billing.catalog.service.BookService;
import jp.smartbrief.billing.identity.repository.UserRepository;
import jp.smartbrief.billing.identity.service.UserContextService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

/**
 * LINE 連携 API コントローラー
 * * 共通サービス (BookService, UserContextService) を利用し、
 * Web版と完全にロジック（10回制限など）を統一したプロフェッショナルな実装です。
 */
@RestController
@RequestMapping("/api/v1/line")
@RequiredArgsConstructor
public class LineController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserContextService userContextService;
    private final BookService bookService;

    /**
     * アカウント連携API
     */
@PostMapping("/link")
    @Transactional
    public Mono<ResponseEntity<Map<String, String>>> linkAccount(@RequestBody LinkRequest request) {
        return userRepository.findByUsername(request.getUsername())
                .filter(user -> passwordEncoder.matches(request.getPassword(), user.getPassword()))
                .flatMap(user -> {
                    user.setLineUserId(request.getLineUserId());
                    return userRepository.save(user)
                            .map(saved -> {
                                // ★ プランに応じてメッセージを出し分け
                                String message;
                                if ("PREMIUM".equalsIgnoreCase(saved.getPlanType())) {
                                    message = "連携に成功しました！\nWebのプレミアム機能がLINEでも有効になります。";
                                } else {
                                    message = "連携に成功しました！\n1日10回までLINEでも無料で読めるようになります。";
                                }

                                return ResponseEntity.ok(Objects.requireNonNull(
                                    Map.of("message", message)
                                ));
                            });
                })
                .defaultIfEmpty(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Objects.requireNonNull(Map.of("message", "IDまたはパスワードが間違っています。"))));
    }
    /**
     * 閲覧API (LINE用：10回制限版)
     * * 軽量化と一元化を実現するため、共通の BookService を利用します。
     */
// --- 2. 閲覧API (LINE用：10回制限版) ---
@PostMapping("/read")
@Transactional
public Mono<ResponseEntity<Object>> readBook(@RequestBody ReadRequest request) {
    
    return userContextService.resolveUserContextByLineId(request.getLineUserId())
            .flatMap(context -> {
                if (!context.isAuthenticated()) {
                    return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "NOT_LINKED"));
                }
                
                // ★修正のポイント: (Object) でキャストするか、明示的に型を指定します
                return bookService.getBookDetailWithLimit(
                        Objects.requireNonNull(request.getBookId()), 
                        context, 
                        10)
                    .map(bookResponse -> ResponseEntity.ok((Object) bookResponse)); // ここを (Object) にキャスト
            })
            .onErrorResume(e -> {
                // (以下、エラーハンドリング。ここも ResponseEntity<Object> に合わせます)
                String message = "作品が見つかりません。";
                HttpStatus status = HttpStatus.NOT_FOUND;

                if (e instanceof ResponseStatusException rse) {
                    status = (HttpStatus) rse.getStatusCode();
                    
                    if (status == HttpStatus.FORBIDDEN) {
                        // ★ 1. 新しい「丁寧なメッセージ」だけを残します
                        message = "無料プランの1日の閲覧制限（10回）に達しました。\n\n" +
                                  "🚀 今すぐ無制限で読むなら：\n" +
                                  "Webでプレミアムプランに登録してください。すぐに制限が解除されます！\n\n" +
                                  "⏳ 明日まで待つなら：\n" +
                                  "明日になれば、また10回分を無料で閲覧いただけます。\n\n" +
                                  "▼ プレミアム登録・アカウント連携はこちら\n" +
                                  "https://smartbrief.jp/link-account";
                    } else {
                        // ★ 2. 403以外（404など）の場合は、元のエラー理由を返します
                        message = rse.getReason();
                    }
                } else if ("NOT_LINKED".equals(e.getMessage())) {
                    status = HttpStatus.UNAUTHORIZED;
                    message = "アカウントが連携されていません。\nメニューの「連携する」からログイン情報を入力してください。";
                }
                // ここも (Object) へのキャストが必要です
                return Mono.just(ResponseEntity.status(status)
                        .body((Object) Objects.requireNonNull(Map.of("message", message))));
            });
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