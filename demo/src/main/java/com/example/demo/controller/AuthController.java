package com.example.demo.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.JwtUtil;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/auth")
// @CrossOrigin は SecurityConfig で一元管理されているため不要
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // コンストラクタ（依存性の注入）
    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    // --- 1. ログイン処理 ---
    @PostMapping("/login")
    public Mono<ResponseEntity<Map<String, String>>> login(@RequestBody AuthRequest request) {
        // ... (ログイン処理は変更なし) ...
        return userRepository.findByUsername(request.getUsername())
            .filter(user -> passwordEncoder.matches(request.getPassword(), user.getPassword()))
            .map(user -> {
                // トークン生成
                String token = jwtUtil.generateToken(user.getUsername());
                return ResponseEntity.ok(Map.of("token", token));
            })
            .defaultIfEmpty(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    // --- 2. 新規会員登録処理（最終修正版） ---
    @PostMapping("/register")
    public Mono<ResponseEntity<String>> register(@RequestBody AuthRequest request) {
        
        String username = request.getUsername();
        String password = request.getPassword();

        // === 🛡️ セキュリティチェック (省略なし) ===
        if (username != null && username.equals(password)) {
            return Mono.just(ResponseEntity.badRequest().body("IDと同じパスワードは使用できません。"));
        }
        String regex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$";
        if (password == null || !password.matches(regex)) {
             return Mono.just(ResponseEntity.badRequest().body("パスワードは8文字以上で、大文字・小文字・数字・記号(!@#$%^&*)を含めてください。"));
        }
        // === 🛡️ セキュリティチェックここまで ===


        // ユーザー名の重複チェック
        return userRepository.findByUsername(request.getUsername())
            .flatMap(existingUser -> 
                Mono.just(ResponseEntity.badRequest().body("このユーザー名は既に使用されています"))
            )
            .switchIfEmpty(Mono.defer(() -> {
                // ユーザー作成
                User newUser = new User();
                newUser.setUsername(request.getUsername());
                newUser.setPassword(passwordEncoder.encode(request.getPassword()));
                
                // ★★★ 修正箇所 1: roles は String（カンマ区切り）で設定（Userエンティティの型に合わせる）
                //     ★修正箇所 2: planType を明示的に設定（DBのNOT NULL制約回避）
                newUser.setRoles("ROLE_USER"); 
                newUser.setPlanType("FREE");
                
                // 保存
                return userRepository.save(newUser)
                    .map(savedUser -> ResponseEntity.ok("ユーザー登録が完了しました"));
            }));
    }
    
    // --- リクエスト受け取り用のクラス (AuthRequest は変更なし) ---
    // ... (AuthRequest クラスは変更なし) ...
    public static class AuthRequest {
        private String username;
        private String password;

        // デフォルトコンストラクタ
        public AuthRequest() {}

        public AuthRequest(String username, String password) {
            this.username = username;
            this.password = password;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}