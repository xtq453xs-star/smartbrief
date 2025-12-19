package jp.smartbrief.billing.catalog.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jp.smartbrief.billing.catalog.domain.UserBookHistory;
import jp.smartbrief.billing.catalog.domain.Work;
import jp.smartbrief.billing.catalog.dto.BookResponse;
import jp.smartbrief.billing.catalog.repository.UserBookHistoryRepository;
import jp.smartbrief.billing.catalog.repository.WorkRepository;
import jp.smartbrief.billing.identity.service.UserContextService.UserContext;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

/**
 * 書籍サービス
 * ビジネスロジック（閲覧制限判定、履歴保存など）を一元管理します。
 */
@Service
@RequiredArgsConstructor
public class BookService {

    private final WorkRepository workRepository;
    private final UserBookHistoryRepository historyRepository;

    /**
     * 本の詳細を取得し、必要に応じて履歴を保存する
     * ★API一元化の原則に基づき、ロジックをここに集約
     */
    public Mono<BookResponse> getBookDetailWithLimit(Integer workId, UserContext context, int dailyLimit) {
    Integer bId = Objects.requireNonNull(workId);
    Long uId = Objects.requireNonNull(context.userId());

    if (context.isPremium()) {
        return processFetchAndSave(bId, uId, true);
    } else {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        return historyRepository.countByUserIdAndViewedAtAfter(uId, todayStart)
            .flatMap(count -> {
                if (count >= dailyLimit) { // 引数の制限値を使用
                    return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, 
                        "無料プランの1日の閲覧制限（" + dailyLimit + "回）に達しました。"));
                }
                return processFetchAndSave(bId, uId, false);
            });
        }
    }

    private Mono<BookResponse> processFetchAndSave(Integer workId, Long userId, boolean isPremium) {
        // ここで Objects.requireNonNull を使ってガードを固めます
        return workRepository.findById(Objects.requireNonNull(workId))
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "作品が見つかりません")))
            .flatMap(work -> {
                Integer bId = Objects.requireNonNull(work.getId());
                
                return historyRepository.findFirstByUserIdAndBookIdOrderByViewedAtDesc(userId, bId)
                    .flatMap(latest -> {
                        // 1分以内の重複閲覧は保存をスキップ
                        if (latest.getViewedAt().isAfter(LocalDateTime.now().minusSeconds(60))) {
                            return Mono.just(work);
                        }
                        return Mono.empty();
                    })
                    .switchIfEmpty(Mono.defer(() -> {
                        // 履歴の新規保存
                        UserBookHistory history = new UserBookHistory();
                        history.setUserId(userId);
                        history.setBookId(bId);
                        history.setBookTitle(work.getTitle());
                        history.setAuthorName(work.getAuthorName());
                        history.setViewedAt(LocalDateTime.now());
                        return historyRepository.save(history).thenReturn(work);
                    }))
                    .map(w -> {
                        // ★詳細表示の時だけ本文（bodyText）をセットして返す
                        BookResponse resp = BookResponse.from((Work) w, isPremium);
                        if (resp != null) {
                            resp.setBodyText(((Work) w).getBodyText());
                        }
                        return resp;
                    });
            });
    }
}