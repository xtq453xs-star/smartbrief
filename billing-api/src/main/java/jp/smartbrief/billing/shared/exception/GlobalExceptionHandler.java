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
    // 既存の renderErrorResponse メソッドをこれに置き換え
    private Mono<ServerResponse> renderErrorResponse(ServerRequest request) {
        Map<String, Object> errorProperties = getErrorAttributes(request, ErrorAttributeOptions.defaults());
        
        int status = (int) errorProperties.getOrDefault("status", 500);
        Throwable errorObj = getError(request);
        
        // 開発者向けにサーバーログにはエラーを1行だけ残す
        if (errorObj != null) {
            System.err.println("⚠ [GlobalErrorHandler] " + errorObj.getClass().getSimpleName() + " at " + request.path());
        }

        // クライアント（ブラウザ）へ返すJSONをシンプルにする
        Map<String, Object> body = Map.of(
            "status", status,
            "error", "Internal Server Error",
            "message", "Unexpected error occurred", // 詳細は隠す
            "path", request.path()
        );

        return ServerResponse.status(status)
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(body));
    }
}