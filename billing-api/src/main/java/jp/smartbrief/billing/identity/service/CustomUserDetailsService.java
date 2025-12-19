package jp.smartbrief.billing.identity.service;

import org.springframework.security.core.userdetails.ReactiveUserDetailsService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import jp.smartbrief.billing.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

/**
 * カスタムユーザー詳細サービス
 * 
 * ユーザー名からユーザー情報を取得し、UserDetails オブジェクトを返します。
 * Spring Security の認証プロセスで使用される UserDetailsService の実装です。
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements ReactiveUserDetailsService {

    private final UserRepository userRepository;

    @Override
    public Mono<UserDetails> findByUsername(String username) {
        return userRepository.findByUsername(username)
                .switchIfEmpty(Mono.error(new UsernameNotFoundException("User not found")))
                .map(user -> org.springframework.security.core.userdetails.User
                        .withUsername(user.getUsername())
                        .password(user.getPassword()) // DBにあるハッシュ化されたパスワード
                        .roles("USER")                // 権限（とりあえずUSER固定）
                        .build());
    }
}