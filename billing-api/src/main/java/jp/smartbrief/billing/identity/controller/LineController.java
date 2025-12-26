package jp.smartbrief.billing.identity.controller;

import java.util.Map;
import java.util.Objects; // ★ これで未使用警告が消えます

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
import jp.smartbrief.billing.identity.domain.User;
import jp.smartbrief.billing.identity.repository.UserRepository;
import jp.smartbrief.billing.shared.dto.UserContext;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

/**
 * LINE 連携 API コントローラー
 * * 責務:
 * 1. LINE IDとWebアカウントの紐付け (Link)
 * 2. LINE経由での書籍閲覧 (Read) - BookServiceへ委譲
 */
@RestController
@RequestMapping("/api/v1/line")
@RequiredArgsConstructor
public class LineController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BookService bookService;

    /**
     * アカウント連携API
     */
    @PostMapping("/link")
    @Transactional
    public Mono<ResponseEntity<Map<String, String>>> linkAccount(@RequestBody LinkRequest request) {
        // バリデーション
        if (request.getUsername() == null || request.getPassword() == null || request.getLineUserId() == null) {
            return Mono.just(createResponse("入力情報が不足しています。", HttpStatus.BAD_REQUEST));
        }

        return userRepository.findByUsername(request.getUsername())
                .filter(user -> passwordEncoder.matches(request.getPassword(), user.getPassword()))
                .flatMap(user -> {
                    user.setLineUserId(request.getLineUserId());
                    return userRepository.save(user);
                })
                .map(this::createLinkSuccessResponse)
                .defaultIfEmpty(createResponse("IDまたはパスワードが間違っています。", HttpStatus.UNAUTHORIZED));
    }

    /**
     * 閲覧API (LINE用：10回制限版)
     */
    @PostMapping("/read")
    @Transactional
    public Mono<ResponseEntity<Object>> readBook(@RequestBody ReadRequest request) {
        // バリデーション
        if (request.getLineUserId() == null || request.getBookId() == null) {
            return Mono.just(
                ResponseEntity.badRequest()
                    .body((Object) Map.of("message", "リクエスト情報が不足しています。"))
            );
        }

        // 1. ユーザー特定 -> 2. コンテキスト生成 -> 3. 閲覧処理 -> 4. エラーハンドリング
        return userRepository.findByLineUserId(request.getLineUserId())
                .map(UserContext::from)
                .defaultIfEmpty(UserContext.guest())
                .flatMap(context -> executeReadBook(context, request.getBookId()))
                .onErrorResume(this::handleReadError);
    }

    // --- Private Methods (Logic) ---

    /**
     * 閲覧ロジックの実行
     */
    private Mono<ResponseEntity<Object>> executeReadBook(UserContext context, Integer bookId) {
        if (!context.isAuthenticated()) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "NOT_LINKED"));
        }

        // BookServiceへ委譲
        return bookService.getBookDetailWithLimit(bookId, context, 10)
                .map(bookResponse -> ResponseEntity.ok((Object) bookResponse));
    }

    /**
     * 連携成功時のレスポンス生成
     */
    private ResponseEntity<Map<String, String>> createLinkSuccessResponse(User user) {
        String message;
        if ("PREMIUM".equalsIgnoreCase(user.getPlanType())) {
            message = "連携に成功しました！\nWebのプレミアム機能がLINEでも有効になります。";
        } else {
            message = "連携に成功しました！\n1日10回までLINEでも無料で読めるようになります。";
        }
        return ResponseEntity.ok(Map.of("message", message));
    }

    /**
     * 閲覧エラーのハンドリング
     */
    private Mono<ResponseEntity<Object>> handleReadError(Throwable e) {
        String message = "作品が見つかりません。";
        HttpStatus status = HttpStatus.NOT_FOUND;

        if (e instanceof ResponseStatusException rse) {
            status = (HttpStatus) rse.getStatusCode();
            
            if (status == HttpStatus.FORBIDDEN) {
                message = """
                        無料プランの1日の閲覧制限（10回）に達しました。
                        
                        🚀 今すぐ無制限で読むなら：
                        Webでプレミアムプランに登録してください。すぐに制限が解除されます！
                        
                        ⏳ 明日まで待つなら：
                        明日になれば、また10回分を無料で閲覧いただけます。
                        
                        ▼ プレミアム登録・アカウント連携はこちら
                        https://smartbrief.jp/link-account""";
            } else {
                message = rse.getReason();
            }
        } else if ("NOT_LINKED".equals(e.getMessage())) {
            status = HttpStatus.UNAUTHORIZED;
            message = "アカウントが連携されていません。\nメニューの「連携する」からログイン情報を入力してください。";
        }

        // ★修正: Objects.requireNonNull で status をラップし、Null警告と未使用インポート警告を同時に解決
        return Mono.just(ResponseEntity.status(Objects.requireNonNull(status))
                .body(Map.of("message", message)));
    }

    /**
     * シンプルなレスポンス生成ヘルパー
     */
    private ResponseEntity<Map<String, String>> createResponse(String message, HttpStatus status) {
        // ここでも念のため Objects.requireNonNull を使っておく（お好みで）
        return ResponseEntity.status(Objects.requireNonNull(status))
                .body(Map.of("message", message));
    }

    // --- DTOs ---

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