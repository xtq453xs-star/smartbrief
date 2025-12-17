package com.example.demo.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * グローバル例外ハンドラー
 * 
 * アプリケーション全体で発生した例外を一元管理します。
 * ResponseStatusException などの Spring Security 関連の例外を
 * 適切なステータスコードと共にクライアントに返します。
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public Mono<ResponseEntity<String>> handleAllExceptions(Exception ex) {
        
        // ★修正ポイント: もしアプリが意図的に投げたエラー(403/404など)なら、そのステータスを尊重する
        if (ex instanceof ResponseStatusException) {
            ResponseStatusException rse = (ResponseStatusException) ex;
            // ログはINFOレベルで控えめに（バグではないため）
            log.info("Handled expected exception: {} {}", rse.getStatusCode(), rse.getReason());
            
            return Mono.just(ResponseEntity
                    .status(rse.getStatusCode())
                    .body(rse.getReason()));
        }

        // それ以外の予期せぬエラー（バグなど）は、今まで通りログを出して500にする
        log.error("★★★ [Global Error Handler] Caught exception: ", ex);
        return Mono.just(ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Internal Server Error: " + ex.getMessage()));
    }
}