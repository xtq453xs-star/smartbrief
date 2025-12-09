package com.example.demo.repository;

import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.domain.User;

import reactor.core.publisher.Mono;

@Repository
public interface UserRepository extends ReactiveCrudRepository<User, Long> {
    // ユーザー名での検索（ログイン認証用）
    Mono<User> findByUsername(String username);
}