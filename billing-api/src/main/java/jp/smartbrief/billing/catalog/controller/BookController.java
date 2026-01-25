package jp.smartbrief.billing.catalog.controller;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType; // ★必須
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import jp.smartbrief.billing.catalog.domain.UserFavorite;
import jp.smartbrief.billing.catalog.domain.Work;
import jp.smartbrief.billing.catalog.dto.BookResponse;
import jp.smartbrief.billing.catalog.repository.UserBookHistoryRepository;
import jp.smartbrief.billing.catalog.repository.UserFavoriteRepository;
import jp.smartbrief.billing.catalog.repository.WorkRepository;
import jp.smartbrief.billing.catalog.service.BookService;
import jp.smartbrief.billing.catalog.service.AISearchService;
import jp.smartbrief.billing.identity.domain.User;
import jp.smartbrief.billing.shared.dto.UserContext;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * 書籍 API コントローラー
 * * Cloudflareの圧縮競合を防ぐため、一覧APIはすべて ResponseEntity でラップし、
 * Content-Length を確定させてから送信します。
 */
@RestController
@RequestMapping("/api/v1/books")
@RequiredArgsConstructor
public class BookController {

    private final WorkRepository workRepository;
    private final UserBookHistoryRepository historyRepository;
    private final UserFavoriteRepository favoriteRepository;
    private final BookService bookService; 
    private final AISearchService aiSearchService;

    // =========================================================================
    // AI 検索 & トレンド
    // =========================================================================

    // ★修正: produces を指定し、戻り値を ResponseEntity で包む
    @GetMapping(value = "/search/ai", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<List<BookResponse>>> searchByAi(
            @RequestParam(name = "q") String query,
            @AuthenticationPrincipal User user) {

        UserContext context = UserContext.from(user);

        return aiSearchService.searchBySemantics(query)
                .map(work -> BookResponse.from(work, context.isPremium()))
                .collectList()
                .map(ResponseEntity::ok);
    }

    // ★修正: produces を指定し、戻り値を ResponseEntity で包む
    @GetMapping(value = "/ranking", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<List<BookResponse>>> getRanking(@AuthenticationPrincipal User user) {
        UserContext context = UserContext.from(user);

        return historyRepository.findTopBookIds()
                .collectList()
                .flatMapMany(ids -> {
                    if (ids.isEmpty()) return Flux.empty();
                    
                    return workRepository.findAllById(ids)
                            .collectList()
                            .flatMapMany(works -> {
                                works.sort(Comparator.comparingInt(w -> ids.indexOf(w.getId())));
                                return Flux.fromIterable(works);
                            });
                })
                .map(work -> BookResponse.from(work, context.isPremium()))
                .collectList()
                .map(ResponseEntity::ok); // ★これでチャンク送信を防止！
    }

    // =========================================================================
    // 作品詳細 & パーソナルデータ
    // =========================================================================

    // ★詳細は単体データなのでそのままでOK
    @GetMapping(value = "/{workId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<BookResponse>> getBookDetail(
            @PathVariable Integer workId,
            @AuthenticationPrincipal User user) {

        UserContext context = UserContext.from(user);
        validateAuthentication(context);

        return bookService.getBookDetailWithLimit(Objects.requireNonNull(workId), context, 10)
                .map(ResponseEntity::ok);
    }

    // ★修正: produces を指定し、戻り値を ResponseEntity で包む
    @GetMapping(value = "/history", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<List<BookResponse>>> getHistory(@AuthenticationPrincipal User user) {
        UserContext context = UserContext.from(user);
        validateAuthentication(context);

        return historyRepository.findHistoryByUserId(context.userId())
                .filter(history -> history.getBookId() != null)
                .flatMap(history -> 
                    workRepository.findById(Objects.requireNonNull(history.getBookId()))
                            .map(work -> BookResponse.from(work, context.isPremium()))
                )
                .collectList()
                .map(ResponseEntity::ok);
    }

    // ★修正: produces を指定し、戻り値を ResponseEntity で包む
    @GetMapping(value = "/favorites", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<List<BookResponse>>> getFavorites(@AuthenticationPrincipal User user) {
        UserContext context = UserContext.from(user);
        validateAuthentication(context);

        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(context.userId())
                .filter(fav -> fav.getBookId() != null)
                .flatMap(fav -> 
                    workRepository.findById(Objects.requireNonNull(fav.getBookId()))
                            .map(work -> BookResponse.from(work, context.isPremium()))
                )
                .collectList()
                .map(ResponseEntity::ok);
    }

    @GetMapping("/{workId}/favorite")
    public Mono<ResponseEntity<Map<String, Boolean>>> checkFavorite(
            @PathVariable Integer workId,
            @AuthenticationPrincipal User user) {

        UserContext context = UserContext.from(user);
        validateAuthentication(context);

        return favoriteRepository.existsByUserIdAndBookId(context.userId(), Objects.requireNonNull(workId))
                .map(exists -> ResponseEntity.ok(Map.of("isFavorite", exists)));
    }

    @PostMapping("/{workId}/favorite")
    public Mono<ResponseEntity<Map<String, Boolean>>> toggleFavorite(
            @PathVariable Integer workId,
            @AuthenticationPrincipal User user) {

        UserContext context = UserContext.from(user);
        validateAuthentication(context);

        Long userId = context.userId();
        Integer safeWorkId = Objects.requireNonNull(workId);

        return favoriteRepository.existsByUserIdAndBookId(userId, safeWorkId)
                .flatMap(exists -> {
                    if (exists) {
                        return favoriteRepository.deleteByUserIdAndBookId(userId, safeWorkId)
                                .thenReturn(ResponseEntity.ok(Map.of("isFavorite", false)));
                    } 
                    return workRepository.findById(safeWorkId)
                            .flatMap(work -> {
                                UserFavorite fav = UserFavorite.builder()
                                        .userId(userId)
                                        .bookId(work.getId())
                                        .bookTitle(work.getTitle())
                                        .authorName(work.getAuthorName())
                                        .createdAt(LocalDateTime.now())
                                        .build();

                                return favoriteRepository.save(Objects.requireNonNull(fav))
                                        .thenReturn(ResponseEntity.ok(Map.of("isFavorite", true)));
                            });
                });
    }

    // =========================================================================
    // 検索 & フィルタリング
    // =========================================================================

    // ★修正: produces を指定し、戻り値を ResponseEntity で包む
    @GetMapping(value = "/search", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<List<BookResponse>>> search(
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(name = "type", required = false) String type,
            @RequestParam(name = "limit", defaultValue = "50") int limit,
            @RequestParam(name = "offset", defaultValue = "0") int offset,
            @RequestParam(name = "sort", required = false) String sort,
            @AuthenticationPrincipal User user) {

        UserContext context = UserContext.from(user);
        boolean isLengthDesc = "length_desc".equalsIgnoreCase(sort);

        Flux<Work> worksFlux;

        if ("translation".equalsIgnoreCase(type)) {
            worksFlux = isLengthDesc 
                    ? workRepository.findByCategoryOrderByLength("Gutenberg", limit, offset)
                    : workRepository.findByCategory("Gutenberg", limit, offset);
        } else {
            if (query == null || query.isBlank()) return Mono.just(ResponseEntity.ok(List.of()));
            String searchPattern = "%" + query.trim() + "%";
            worksFlux = isLengthDesc
                    ? workRepository.searchByKeywordOrderByLength(searchPattern, limit, offset)
                    : workRepository.searchByKeyword(searchPattern, limit, offset);
        }

        return worksFlux
                .map(work -> BookResponse.from(work, context.isPremium()))
                .collectList()
                .map(ResponseEntity::ok);
    }

    // ★修正: produces を指定し、戻り値を ResponseEntity で包む
    @GetMapping(value = "/search/genre", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<List<BookResponse>>> searchByGenre(
            @RequestParam(name = "q") String genre,
            @RequestParam(name = "limit", defaultValue = "50") int limit,
            @RequestParam(name = "offset", defaultValue = "0") int offset,
            @RequestParam(name = "sort", required = false) String sort,
            @AuthenticationPrincipal User user) {

        UserContext context = UserContext.from(user);
        String searchPattern = "%" + genre.trim() + "%";

        Flux<Work> worksFlux = "length_desc".equalsIgnoreCase(sort)
                ? workRepository.findByGenreTagContainingOrderByLength(searchPattern, limit, offset)
                : workRepository.findByGenreTagContaining(searchPattern, limit, offset);

        return worksFlux
                .map(work -> BookResponse.from(work, context.isPremium()))
                .collectList()
                .map(ResponseEntity::ok);
    }

    // ★修正: produces を指定し、戻り値を ResponseEntity で包む
    @GetMapping(value = "/suggest", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<List<BookResponse>>> suggest(
            @RequestParam(name = "q") String query,
            @AuthenticationPrincipal User user) {

        UserContext context = UserContext.from(user);

        if (query == null || query.trim().length() < 2) return Mono.just(ResponseEntity.ok(List.of()));

        String searchPattern = "%" + query.trim() + "%";

        return workRepository.searchByKeyword(searchPattern, 10, 0)
                .map(work -> BookResponse.from(work, context.isPremium()))
                .collectList()
                .map(ResponseEntity::ok);
    }

    // =========================================================================
    // 静的データ・マスター情報
    // =========================================================================

    @GetMapping(value = "/authors", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<List<String>>> getAuthors() {
        return workRepository.findTopAuthors().collectList().map(ResponseEntity::ok);
    }

    @GetMapping(value = "/authors/all", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<List<String>>> getAllAuthors() {
        return workRepository.findAllAuthors().collectList().map(ResponseEntity::ok);
    }

    @GetMapping(value = "/genres", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<List<String>>> getAllGenres() {
        return workRepository.findAllGenreTags()
                .collectList()
                .map(allTagsList -> {
                    Map<String, Long> tagCounts = allTagsList.stream()
                            .filter(Objects::nonNull)
                            .flatMap(str -> Arrays.stream(str.split(",")))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .collect(Collectors.groupingBy(tag -> tag, Collectors.counting()));

                    return tagCounts.entrySet().stream()
                            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                            .limit(40)
                            .map(Map.Entry::getKey)
                            .collect(Collectors.toList());
                })
                .map(ResponseEntity::ok);
    }

    // =========================================================================
    // ヘルパーメソッド
    // =========================================================================

    private void validateAuthentication(UserContext context) {
        if (!context.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "ログインが必要です。");
        }
    }
}