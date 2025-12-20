package jp.smartbrief.billing.identity.controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

import jp.smartbrief.billing.identity.domain.User;
import jp.smartbrief.billing.identity.repository.UserRepository;
import jp.smartbrief.billing.shared.security.JwtUtil;
import reactor.core.publisher.Mono;

/**
 * 認証 API コントローラー
 * VS Codeの厳格なNull安全性警告を回避するため、
 * 引数や定数を Objects.requireNonNull() でラップして型安全性を保証しています。
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    
    @Value("${n8n.webhook.email:https://n8n.smartbrief.jp/webhook/send-email}")
    private String n8nEmailWebhookUrl;

    @Value("${n8n.webhook.verify:https://n8n.smartbrief.jp/webhook/webhook/verify-email}")
    private String n8nVerifyEmailWebhookUrl;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    // --- ヘルパーメソッド: JSON形式のレスポンスを作成 ---
    private ResponseEntity<Map<String, String>> createResponse(String message, HttpStatus status) {
        return new ResponseEntity<>(
            Objects.requireNonNull(Collections.singletonMap("message", message)), 
            Objects.requireNonNull(status) // ★statusもラップして警告回避
        );
    }

    // --- 1. ログイン処理 ---
    @PostMapping("/login")
    public Mono<ResponseEntity<Map<String, String>>> login(@RequestBody @NonNull AuthRequest request) {
        return userRepository.findByUsernameOrEmail(request.getUsername()) 
            .filter(user -> passwordEncoder.matches(request.getPassword(), user.getPassword()))
            .flatMap(user -> {
                if (!Boolean.TRUE.equals(user.getIsVerified())) {
                    return Mono.just(createResponse("メールアドレスの認証が完了していません。受信トレイを確認してください。", HttpStatus.UNAUTHORIZED));
                }

                String token = jwtUtil.generateToken(user.getUsername());
                return Mono.just(new ResponseEntity<>(
                    Objects.requireNonNull(Map.of("token", token)),
                    Objects.requireNonNull(HttpStatus.OK)
                ));
            })
            .defaultIfEmpty(createResponse("ユーザー名またはパスワードが正しくありません。", HttpStatus.UNAUTHORIZED));
    }

    // --- 2. 新規会員登録処理 ---
    @PostMapping("/register")
    public Mono<ResponseEntity<Map<String, String>>> register(@RequestBody @NonNull AuthRequest request) {
        
        String username = request.getUsername();
        String email = request.getEmail();
        String password = request.getPassword();

        if (username == null || email == null || password == null) {
             return Mono.just(createResponse("必須項目（ID, Email, Password）が入力されていません。", HttpStatus.BAD_REQUEST));
        }
        if (username.equals(password)) {
            return Mono.just(createResponse("IDと同じパスワードは使用できません。", HttpStatus.BAD_REQUEST));
        }
        if (!email.contains("@") || !email.contains(".")) {
             return Mono.just(createResponse("有効なメールアドレスを入力してください。", HttpStatus.BAD_REQUEST));
        }
        
        String regex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$";
        if (!password.matches(regex)) {
             return Mono.just(createResponse("パスワードは8文字以上で、大文字・小文字・数字・記号(!@#$%^&*)を含めてください。", HttpStatus.BAD_REQUEST));
        }

        return userRepository.findByUsername(username)
            .flatMap(u -> Mono.just(createResponse("このユーザーIDは既に使用されています", HttpStatus.BAD_REQUEST)))
            .switchIfEmpty(
                userRepository.findByEmail(email)
                    .flatMap(u -> Mono.just(createResponse("このメールアドレスは既に登録されています", HttpStatus.BAD_REQUEST)))
                    .switchIfEmpty(Mono.defer(() -> {
                        User newUser = new User();
                        newUser.setUsername(username);
                        newUser.setEmail(email);
                        newUser.setPassword(passwordEncoder.encode(password));
                        newUser.setRoles("ROLE_USER");
                        newUser.setPlanType("FREE");
                        
                        newUser.setIsVerified(false);
                        String token = UUID.randomUUID().toString();
                        newUser.setVerificationToken(token);
                        
                        return userRepository.save(newUser)
                            .flatMap(savedUser -> {
                                WebClient.create()
                                    .post()
                                    .uri(Objects.requireNonNull(n8nVerifyEmailWebhookUrl))
                                    .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON)) // ★ラップ
                                    .bodyValue(Objects.requireNonNull(Map.of(
                                        "email", savedUser.getEmail(),
                                        "username", savedUser.getUsername(),
                                        "verification_token", token
                                    )))
                                    .retrieve()
                                    .toBodilessEntity()
                                    .subscribe();

                                return Mono.just(createResponse("仮登録が完了しました。送信されたメール内のリンクをクリックして認証を完了してください。", HttpStatus.OK));
                            });
                    }))
            );
    }

    // --- メール認証実行API ---
    @PostMapping("/verify-email")
    public Mono<ResponseEntity<Map<String, String>>> verifyEmail(@RequestParam("token") @NonNull String token) {
        if (token.isEmpty()) {
            return Mono.just(createResponse("トークンが無効です", HttpStatus.BAD_REQUEST));
        }

        return userRepository.findByVerificationToken(token) 
            .flatMap(user -> {
                if (Boolean.TRUE.equals(user.getIsVerified())) {
                    return Mono.just(createResponse("既に認証済みです。ログインしてください。", HttpStatus.OK));
                }
                
                user.setIsVerified(true);
                user.setVerificationToken(null);

                return userRepository.save(user)
                    .map(saved -> createResponse("メール認証が完了しました！", HttpStatus.OK));
            })
            .switchIfEmpty(Mono.just(createResponse("無効なトークンか、期限切れです。", HttpStatus.BAD_REQUEST)));
    }
    
    // --- 3. パスワードリセット要求 ---
    @PostMapping("/forgot-password")
    public Mono<ResponseEntity<Map<String, String>>> forgotPassword(@RequestBody @NonNull Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isEmpty()) {
            return Mono.just(createResponse("メールアドレスを入力してください", HttpStatus.BAD_REQUEST));
        }

        return userRepository.findByEmail(email)
            .flatMap(user -> {
                String token = UUID.randomUUID().toString();
                user.setResetPasswordToken(token);
                user.setResetPasswordExpiresAt(LocalDateTime.now().plusHours(1));

                return userRepository.save(user)
                    .flatMap(savedUser -> {
                        return WebClient.create()
                            .post()
                            .uri(Objects.requireNonNull(n8nEmailWebhookUrl))
                            .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON)) // ★ラップ
                            .bodyValue(Objects.requireNonNull(Map.of(
                                "email", savedUser.getEmail(),
                                "username", savedUser.getUsername(),
                                "resetToken", token
                            )))
                            .retrieve()
                            .toBodilessEntity()
                            .thenReturn(createResponse("パスワード再設定メールを送信しました。", HttpStatus.OK));
                    });
            })
            .switchIfEmpty(Mono.just(createResponse("そのメールアドレスは登録されていません。", HttpStatus.NOT_FOUND)));
    }

    // --- 4. パスワードリセット実行 ---
    @PostMapping("/reset-password")
    public Mono<ResponseEntity<Map<String, String>>> resetPassword(@RequestBody @NonNull Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("password");

        if (token == null || newPassword == null) {
            return Mono.just(createResponse("情報が不足しています", HttpStatus.BAD_REQUEST));
        }
        
        String regex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$";
        if (!newPassword.matches(regex)) {
             return Mono.just(createResponse("パスワードは8文字以上で、大文字・小文字・数字・記号(!@#$%^&*)を含めてください。", HttpStatus.BAD_REQUEST));
        }

        return userRepository.findByResetPasswordToken(token)
            .flatMap(user -> {
                if (user.getResetPasswordExpiresAt().isBefore(LocalDateTime.now())) {
                    return Mono.just(createResponse("リンクの有効期限が切れています。もう一度リクエストしてください。", HttpStatus.BAD_REQUEST));
                }

                user.setPassword(passwordEncoder.encode(newPassword));
                user.setResetPasswordToken(null);
                user.setResetPasswordExpiresAt(null);

                return userRepository.save(user)
                    .map(saved -> createResponse("パスワードが正常に変更されました。新しいパスワードでログインしてください。", HttpStatus.OK));
            })
            .switchIfEmpty(Mono.just(createResponse("無効なリクエストです。", HttpStatus.BAD_REQUEST)));
    }

    // --- 5. 認証メール再送用API ---
    @PostMapping("/resend-verification")
    public Mono<ResponseEntity<Map<String, String>>> resendVerification(@RequestBody @NonNull Map<String, String> request) {
        String email = request.get("email");
        
        if (email == null || email.isEmpty()) {
            return Mono.just(createResponse("メールアドレスを入力してください", HttpStatus.BAD_REQUEST));
        }

        return userRepository.findByEmail(email)
            .flatMap(user -> {
                if (Boolean.TRUE.equals(user.getIsVerified())) {
                    return Mono.just(createResponse("このメールアドレスは既に認証済みです。ログインしてください。", HttpStatus.BAD_REQUEST));
                }

                String newToken = UUID.randomUUID().toString();
                user.setVerificationToken(newToken);

                return userRepository.save(user)
                    .flatMap(savedUser -> {
                        WebClient.create()
                            .post()
                            .uri(Objects.requireNonNull(n8nVerifyEmailWebhookUrl))
                            .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON)) // ★ラップ
                            .bodyValue(Objects.requireNonNull(Map.of(
                                "email", savedUser.getEmail(),
                                "username", savedUser.getUsername(),
                                "verification_token", newToken
                            )))
                            .retrieve()
                            .toBodilessEntity()
                            .subscribe();

                        return Mono.just(createResponse("認証メールを再送しました。受信トレイを確認してください。", HttpStatus.OK));
                    });
            })
            .switchIfEmpty(Mono.just(createResponse("そのメールアドレスは登録されていません。", HttpStatus.NOT_FOUND)));
    }

    // --- 自分のユーザー情報を取得するAPI ---
    @org.springframework.web.bind.annotation.GetMapping("/me")
    public Mono<ResponseEntity<Map<String, Object>>> getMyInfo(Principal principal) { 
        if (principal == null) {
            return Mono.just(new ResponseEntity<>(Objects.requireNonNull(HttpStatus.UNAUTHORIZED))); // ★ラップ
        }

        String username = principal.getName();

        return userRepository.findByUsername(username)
            .map(user -> {
                Map<String, Object> response = new java.util.HashMap<>();
                response.put("username", user.getUsername());
                response.put("email", user.getEmail());
                response.put("plan", user.getPlanType()); 
                response.put("isPremium", "PREMIUM".equalsIgnoreCase(user.getPlanType()));
                
                return new ResponseEntity<>(Objects.requireNonNull(response), Objects.requireNonNull(HttpStatus.OK));
            })
            .defaultIfEmpty(new ResponseEntity<>(Objects.requireNonNull(HttpStatus.NOT_FOUND))); // ★ラップ
    }

    // --- DTO ---
    public static class AuthRequest {
        private String username;
        private String email;
        private String password;

        public AuthRequest() {}
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}