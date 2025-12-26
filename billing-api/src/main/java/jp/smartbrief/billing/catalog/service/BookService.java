package jp.smartbrief.billing.catalog.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects; // ★Nullチェック用に必須

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jp.smartbrief.billing.catalog.domain.UserBookHistory;
import jp.smartbrief.billing.catalog.domain.Work;
import jp.smartbrief.billing.catalog.dto.BookResponse;
import jp.smartbrief.billing.catalog.repository.UserBookHistoryRepository;
import jp.smartbrief.billing.catalog.repository.WorkRepository;
// ★修正: 正しいDTOパッケージをインポート
import jp.smartbrief.billing.shared.dto.UserContext;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

/**
 * 書籍サービス
 * * 以下のビジネスロジックを一元管理します：
 * 1. 閲覧権限の判定（プレミアム会員 vs 無料会員の回数制限）
 * 2. 書籍データの取得
 * 3. 閲覧履歴の記録（重複閲覧の除外制御を含む）
 */
@Service
@RequiredArgsConstructor
public class BookService {

    private final WorkRepository workRepository;
    private final UserBookHistoryRepository historyRepository;

    /**
     * 書籍詳細を取得する（閲覧制限・履歴保存付き）
     * * @param workId 対象の書籍ID (Null許容だが、内部でチェックする)
     * @param context ユーザーコンテキスト（認証情報）
     * @param dailyLimit 無料会員の1日あたりの閲覧上限回数
     */
    public Mono<BookResponse> getBookDetailWithLimit(Integer workId, UserContext context, int dailyLimit) {
        // 1. バリデーション（Fail-Fast）
        // Integer型はnullの可能性があるため、ここで明確に弾くことで以降のロジックを安全にする
        if (workId == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Book ID is required"));
        }
        if (!context.isAuthenticated()) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "ログインが必要です"));
        }

        // 2. 権限チェック（プレミアムならスキップ、無料なら回数確認）
        // 判定ロジックを別メソッドに逃がすことで、メインフローを見やすく保つ
        Mono<Void> permissionCheck = context.isPremium()
            ? Mono.empty()
            : checkDailyLimit(context.userId(), dailyLimit);

        // 3. データ取得と履歴保存の実行
        // requireNonNullを通すことで、IDEやコンパイラに「ここは絶対にnullじゃない」と伝える
        return permissionCheck
            .then(fetchWorkAndRecordHistory(Objects.requireNonNull(workId), context));
    }

    // --- Private Methods: 複雑なロジックを分離 ---

    /**
     * 無料会員の閲覧制限をチェックする
     * DBアクセスを伴うため、非同期(Mono)で返す
     */
    private Mono<Void> checkDailyLimit(Long userId, int limit) {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        
        return historyRepository.countByUserIdAndViewedAtAfter(userId, todayStart)
            .handle((count, sink) -> {
                if (count >= limit) {
                    sink.error(new ResponseStatusException(HttpStatus.FORBIDDEN, 
                        "無料プランの1日の閲覧制限（" + limit + "回）に達しました。"));
                } else {
                    sink.complete(); // チェック通過
                }
            });
    }

    /**
     * 書籍を取得し、履歴を保存してレスポンスに変換する
     */
    private Mono<BookResponse> fetchWorkAndRecordHistory(Integer workId, UserContext context) {
        // ここでも念のため Objects.requireNonNull を使い、Repositoryへの引数不正を防ぐ
        return workRepository.findById(Objects.requireNonNull(workId))
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "作品が見つかりません")))
            .flatMap(work -> 
                // 「履歴保存（副作用）」と「レスポンス生成」をチェーンさせる
                recordHistoryIfNeeded(work, context.userId())
                    .thenReturn(createResponse(work, context.isPremium()))
            );
    }

    /**
     * 履歴を保存する（直近の重複閲覧はスキップ）
     * ※「1分以内の再アクセスはカウントしない」という仕様をここで表現
     */
    private Mono<Void> recordHistoryIfNeeded(Work work, Long userId) {
        Integer bId = work.getId();
        if (bId == null) return Mono.empty(); // IDがないデータは履歴保存不可

        return historyRepository.findFirstByUserIdAndBookIdOrderByViewedAtDesc(userId, bId)
            .filter(latest -> {
                // 履歴の日時チェック（null安全に）
                return latest.getViewedAt() != null 
                    && latest.getViewedAt().isAfter(LocalDateTime.now().minusSeconds(60));
            })
            .hasElement() // 直近の履歴があれば true
            .flatMap(hasRecentHistory -> {
                if (hasRecentHistory) {
                    return Mono.empty(); // 保存スキップ
                }
                // 新規保存
                UserBookHistory history = new UserBookHistory();
                history.setUserId(userId);
                history.setBookId(bId);
                history.setBookTitle(work.getTitle());
                history.setAuthorName(work.getAuthorName());
                history.setViewedAt(LocalDateTime.now());
                
                // saveの結果には興味がない（保存完了さえすればいい）ので .then() でVoidにする
                return historyRepository.save(history).then();
            });
    }

    /**
     * エンティティからレスポンスへの変換
     * 詳細API用なので本文(bodyText)を含める
     */
    private BookResponse createResponse(Work work, boolean isPremium) {
        BookResponse response = BookResponse.from(work, isPremium);
        // DTO変換でnullが返るケース（Workがnullなど）は上流で防いでいるが、念のため
        if (response != null) {
            response.setBodyText(work.getBodyText());
        }
        return response;
    }
}