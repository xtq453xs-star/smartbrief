package jp.smartbrief.billing.shared.exception;

import java.util.Map;
import java.util.Objects; // ★必須

import org.springframework.boot.autoconfigure.web.WebProperties;
import org.springframework.boot.autoconfigure.web.reactive.error.AbstractErrorWebExceptionHandler;
import org.springframework.boot.web.error.ErrorAttributeOptions;
import org.springframework.boot.web.reactive.error.ErrorAttributes;
import org.springframework.context.ApplicationContext;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.server.*;

import reactor.core.publisher.Mono;

/**
 * グローバル例外ハンドラ
 * * 責務: アプリケーション全体で発生した例外をキャッチし、統一されたJSON形式でクライアントに返す。
 * 優先度を高く設定し(@Order(-2))、SpringデフォルトのHTMLエラーページが出ないようにする。
 */
@Component
@Order(-2)
public class GlobalExceptionHandler extends AbstractErrorWebExceptionHandler {

    public GlobalExceptionHandler(ErrorAttributes errorAttributes, WebProperties webProperties,
                                  ApplicationContext applicationContext, ServerCodecConfigurer serverCodecConfigurer) {
        super(errorAttributes, webProperties.getResources(), applicationContext);
        this.setMessageWriters(serverCodecConfigurer.getWriters());
    }

    @Override
    protected RouterFunction<ServerResponse> getRoutingFunction(ErrorAttributes errorAttributes) {
        return RouterFunctions.route(RequestPredicates.all(), this::renderErrorResponse);
    }

    /**
     * エラーレスポンスの生成
     */
    private Mono<ServerResponse> renderErrorResponse(ServerRequest request) {
        // エラー属性の取得 (Spring Boot標準機能)
        Map<String, Object> errorProperties = getErrorAttributes(request, ErrorAttributeOptions.defaults());
        
        // エラー情報の抽出（Nullの場合はデフォルト値を設定）
        int status = (int) errorProperties.getOrDefault("status", 500);
        String message = (String) errorProperties.getOrDefault("message", "Unexpected error occurred");
        String error = (String) errorProperties.getOrDefault("error", "Internal Server Error");

        // 統一レスポンスボディの構築
        Map<String, Object> body = Map.of(
            "status", status,
            "error", error,
            "message", message, // フロントエンドへの表示用メッセージ
            "path", request.path()
        );

        return ServerResponse.status(status)
                // ★修正: 定数や生成したMapであっても、厳格な環境ではNullチェックを求められるためラップする
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                .body(BodyInserters.fromValue(Objects.requireNonNull(body)));
    }
}