package jp.smartbrief.billing.shared.util;

import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;
import org.springframework.lang.NonNull; // ★追加1：これを忘れずに！

/**
 * HTTP リクエストロギングフィルター
 * 
 * すべての HTTP リクエストをインターセプトして、
 * リクエスト情報（メソッド、パス、IP アドレス）をログに記録します。
 */
@Component
@Slf4j
public class RequestLoggingFilter implements WebFilter {

    @Override
    @NonNull // ★追加2：戻り値のMonoにも付けるとより完璧です
    public Mono<Void> filter(@NonNull ServerWebExchange exchange, @NonNull WebFilterChain chain) { // ★追加3：ここ！
        var request = exchange.getRequest();
        
        // ★これが証拠ログです！
        log.info("★★★ [REQUEST DETECTED] Method: {}, Path: {}, IP: {}", 
                 request.getMethod(), 
                 request.getURI().getPath(),
                 request.getRemoteAddress());

        return chain.filter(exchange);
    }
}