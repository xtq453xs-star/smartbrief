package com.example.demo.controller;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam; // ★追加
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

import com.example.demo.domain.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.JwtUtil;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    
    // n8nのメール配信用Webhook URL (パスワードリセット用)
    @Value("${n8n.webhook.email:https://n8n.smartbrief.jp/webhook/send-email}")
    private String n8nEmailWebhookUrl;

    // ★追加: n8nの新規登録認証用Webhook URL (デフォルト値を設定しています)
    @Value("${n8n.webhook.verify:https://n8n.smartbrief.jp/webhook/webhook/verify-email}")
    private String n8nVerifyEmailWebhookUrl;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    // --- 1. ログイン処理 (ID or Email) ---
    @PostMapping("/login")
    public Mono<ResponseEntity<Map<String, String>>> login(@RequestBody AuthRequest request) {
        return userRepository.findByUsernameOrEmail(request.getUsername()) 
            .filter(user -> passwordEncoder.matches(request.getPassword(), user.getPassword()))
            .flatMap(user -> {
                // ★追加: メール認証チェック
                // nullの場合(古いデータ)も考慮して Boolean.TRUE.equals を使用
                if (!Boolean.TRUE.equals(user.getIsVerified())) {
                     return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                             // フロントエンドでこのメッセージを表示します
                             .body(Map.of("message", "メールアドレスの認証が完了していません。受信トレイを確認してください。")));
                }

                // 認証OKならトークン発行
                String token = jwtUtil.generateToken(user.getUsername());
                return Mono.just(ResponseEntity.ok(Map.of("token", token)));
            })
            // ユーザーが見つからない、パスワード違い、または上記でUNAUTHORIZEDを返した場合のハンドリング
            .defaultIfEmpty(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    // --- 2. 新規会員登録処理 (Email対応) ---
    @PostMapping("/register")
    public Mono<ResponseEntity<String>> register(@RequestBody AuthRequest request) {
        
        String username = request.getUsername();
        String email = request.getEmail();
        String password = request.getPassword();

        // 1. バリデーション
        if (username == null || email == null || password == null) {
             return Mono.just(ResponseEntity.badRequest().body("必須項目（ID, Email, Password）が入力されていません。"));
        }
        if (username.equals(password)) {
            return Mono.just(ResponseEntity.badRequest().body("IDと同じパスワードは使用できません。"));
        }
        // 簡易メールチェック
        if (!email.contains("@") || !email.contains(".")) {
             return Mono.just(ResponseEntity.badRequest().body("有効なメールアドレスを入力してください。"));
        }
        
        // パスワード強度チェック
        String regex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$";
        if (!password.matches(regex)) {
             return Mono.just(ResponseEntity.badRequest().body("パスワードは8文字以上で、大文字・小文字・数字・記号(!@#$%^&*)を含めてください。"));
        }

        // 2. 重複チェック
        return userRepository.findByUsername(username)
            .flatMap(u -> Mono.just(ResponseEntity.badRequest().body("このユーザーIDは既に使用されています")))
            .switchIfEmpty(
                userRepository.findByEmail(email)
                    .flatMap(u -> Mono.just(ResponseEntity.badRequest().body("このメールアドレスは既に登録されています")))
                    .switchIfEmpty(Mono.defer(() -> {
                        // 3. ユーザー作成
                        User newUser = new User();
                        newUser.setUsername(username);
                        newUser.setEmail(email);
                        newUser.setPassword(passwordEncoder.encode(password));
                        newUser.setRoles("ROLE_USER");
                        newUser.setPlanType("FREE");
                        
                        // ★変更: 未認証状態で保存 & トークン生成
                        newUser.setIsVerified(false);
                        String token = UUID.randomUUID().toString();
                        newUser.setVerificationToken(token);
                        
                        return userRepository.save(newUser)
                            .flatMap(savedUser -> {
                                // ★追加: n8n へ認証メール送信リクエスト (非同期で送信)
                                WebClient.create()
                                    .post()
                                    .uri(n8nVerifyEmailWebhookUrl)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .bodyValue(Map.of(
                                        "email", savedUser.getEmail(),
                                        "username", savedUser.getUsername(),
                                        "verification_token", token
                                    ))
                                    .retrieve()
                                    .toBodilessEntity()
                                    .subscribe(); // 結果を待たずに送信処理を開始（レスポンス速度優先）

                                return Mono.just(ResponseEntity.ok("仮登録が完了しました。送信されたメール内のリンクをクリックして認証を完了してください。"));
                            });
                    }))
            );
    }

    // --- ★追加: メール認証実行API (フロントエンドから呼ばれる) ---
    @PostMapping("/verify-email")
    public Mono<ResponseEntity<String>> verifyEmail(@RequestParam("token") String token) {
        if (token == null || token.isEmpty()) {
            return Mono.just(ResponseEntity.badRequest().body("トークンが無効です"));
        }

        // トークンでユーザーを検索
        return userRepository.findByVerificationToken(token) 
            .flatMap(user -> {
                if (Boolean.TRUE.equals(user.getIsVerified())) {
                    return Mono.just(ResponseEntity.ok("既に認証済みです。ログインしてください。"));
                }
                
                // 認証完了処理
                user.setIsVerified(true);
                user.setVerificationToken(null); // 使い終わったトークンはクリア

                return userRepository.save(user)
                    .map(saved -> ResponseEntity.ok("メール認証が完了しました！"));
            })
            .switchIfEmpty(Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body("無効なトークンか、期限切れです。")));
    }
    
    // --- 3. パスワードリセット要求 (トークン発行 & n8nへ送信) ---
    @PostMapping("/forgot-password")
    public Mono<ResponseEntity<String>> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isEmpty()) {
            return Mono.just(ResponseEntity.badRequest().body("メールアドレスを入力してください"));
        }

        return userRepository.findByEmail(email)
            .flatMap(user -> {
                // トークン生成 (UUID)
                String token = UUID.randomUUID().toString();
                // 有効期限 (1時間後)
                user.setResetPasswordToken(token);
                user.setResetPasswordExpiresAt(LocalDateTime.now().plusHours(1));

                return userRepository.save(user)
                    .flatMap(savedUser -> {
                        // n8n にメール送信を依頼する
                        return WebClient.create()
                            .post()
                            .uri(n8nEmailWebhookUrl)
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(Map.of(
                                "email", savedUser.getEmail(),
                                "username", savedUser.getUsername(),
                                "resetToken", token
                            ))
                            .retrieve()
                            .toBodilessEntity()
                            .thenReturn(ResponseEntity.ok("パスワード再設定メールを送信しました。"));
                    });
            })
            .switchIfEmpty(Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND).body("そのメールアドレスは登録されていません。")));
    }

    // --- 4. パスワードリセット実行 (新しいパスワード設定) ---
    @PostMapping("/reset-password")
    public Mono<ResponseEntity<String>> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("password");

        if (token == null || newPassword == null) {
            return Mono.just(ResponseEntity.badRequest().body("情報が不足しています"));
        }
        
        // パスワード強度チェック
        String regex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$";
        if (!newPassword.matches(regex)) {
             return Mono.just(ResponseEntity.badRequest().body("パスワードは8文字以上で、大文字・小文字・数字・記号(!@#$%^&*)を含めてください。"));
        }

        return userRepository.findByResetPasswordToken(token)
            .flatMap(user -> {
                // 期限切れチェック
                if (user.getResetPasswordExpiresAt().isBefore(LocalDateTime.now())) {
                    return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body("リンクの有効期限が切れています。もう一度リクエストしてください。"));
                }

                // パスワード更新 & トークン消去
                user.setPassword(passwordEncoder.encode(newPassword));
                user.setResetPasswordToken(null);
                user.setResetPasswordExpiresAt(null);

                return userRepository.save(user)
                    .map(saved -> ResponseEntity.ok("パスワードが正常に変更されました。新しいパスワードでログインしてください。"));
            })
            .switchIfEmpty(Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body("無効なリクエストです。")));
    }
    // --- ★追加 5. 認証メール再送用API ---
    @PostMapping("/resend-verification")
    public Mono<ResponseEntity<String>> resendVerification(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        
        if (email == null || email.isEmpty()) {
            return Mono.just(ResponseEntity.badRequest().body("メールアドレスを入力してください"));
        }

        return userRepository.findByEmail(email)
            .flatMap(user -> {
                // 既に認証済みならエラー（ログインへ誘導）
                if (Boolean.TRUE.equals(user.getIsVerified())) {
                    return Mono.just(ResponseEntity.badRequest().body("このメールアドレスは既に認証済みです。ログインしてください。"));
                }

                // 新しいトークンを再発行
                String newToken = UUID.randomUUID().toString();
                user.setVerificationToken(newToken);

                return userRepository.save(user)
                    .flatMap(savedUser -> {
                        // n8n へ再送信リクエスト
                        WebClient.create()
                            .post()
                            .uri(n8nVerifyEmailWebhookUrl) // 新規登録と同じWebhookを使用
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(Map.of(
                                "email", savedUser.getEmail(),
                                "username", savedUser.getUsername(),
                                "verification_token", newToken
                            ))
                            .retrieve()
                            .toBodilessEntity()
                            .subscribe(); // 非同期実行

                        return Mono.just(ResponseEntity.ok("認証メールを再送しました。受信トレイを確認してください。"));
                    });
            })
            // セキュリティ上、未登録メアドでも「送りました」風にするか迷う所ですが、
            // 今回は分かりやすさ優先でNOT_FOUNDを返します
            .switchIfEmpty(Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND).body("そのメールアドレスは登録されていません。")));
    }

    // --- DTO ---
    public static class AuthRequest {
        private String username;
        private String email;
        private String password;

        public AuthRequest() {}

        public AuthRequest(String username, String email, String password) {
            this.username = username;
            this.email = email;
            this.password = password;
        }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}