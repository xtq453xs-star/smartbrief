package jp.smartbrief.billing.catalog.controller;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects; // ★必須
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
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
import jp.smartbrief.billing.identity.domain.User;
import jp.smartbrief.billing.shared.dto.UserContext;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * 書籍 API コントローラー
 * * すべてのビジネスロジックを BookService に移譲し、認証情報は Spring Security 標準機能で解決します。
 * コントローラーは「リクエストの受付と応答」に専念するプロフェッショナルな構成です。
 */
@RestController
@RequestMapping("/api/v1/books")
@RequiredArgsConstructor
public class BookController {

    private final WorkRepository workRepository;
    private final UserBookHistoryRepository historyRepository;
    private final UserFavoriteRepository favoriteRepository;
    private final BookService bookService; 

    // --- 人気ランキングAPI ---
    @GetMapping("/ranking")
    public Flux<BookResponse> getRanking(@AuthenticationPrincipal User user) {
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
            .map(work -> BookResponse.from(work, context.isPremium()));
    }

    // --- 詳細API ---
    @GetMapping("/{workId}")
    public Mono<ResponseEntity<BookResponse>> getBookDetail(
            @PathVariable Integer workId,
            @AuthenticationPrincipal User user) {
        
        UserContext context = UserContext.from(user);

        if (!context.isAuthenticated()) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "ログインしてください"));
        }
        
        return bookService.getBookDetailWithLimit(Objects.requireNonNull(workId), context, 10)
            .map(ResponseEntity::ok);
    }

    // --- 閲覧履歴取得API ---
    @GetMapping("/history")
    public Flux<BookResponse> getHistory(@AuthenticationPrincipal User user) {
        UserContext context = UserContext.from(user);
        if (!context.isAuthenticated()) return Flux.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        
        return historyRepository.findHistoryByUserId(context.userId())
            .filter(history -> history.getBookId() != null)
            .flatMap(history -> 
                workRepository.findById(Objects.requireNonNull(history.getBookId()))
                    .map(work -> BookResponse.from(work, context.isPremium()))
            );
    }

    // --- お気に入り一覧取得API ---
    @GetMapping("/favorites")
    public Flux<BookResponse> getFavorites(@AuthenticationPrincipal User user) {
        UserContext context = UserContext.from(user);
        if (!context.isAuthenticated()) return Flux.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(context.userId())
            .filter(fav -> fav.getBookId() != null)
            .flatMap(fav -> 
                workRepository.findById(Objects.requireNonNull(fav.getBookId()))
                    .map(work -> BookResponse.from(work, context.isPremium()))
            );
    }

    // --- お気に入り登録状態チェック ---
    @GetMapping("/{workId}/favorite")
    public Mono<ResponseEntity<Map<String, Boolean>>> checkFavorite(
            @PathVariable Integer workId,
            @AuthenticationPrincipal User user) {
        
        UserContext context = UserContext.from(user);
        if (!context.isAuthenticated()) return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        
        return favoriteRepository.existsByUserIdAndBookId(context.userId(), Objects.requireNonNull(workId))
            .map(exists -> ResponseEntity.ok(Map.of("isFavorite", exists)));
    }

    // --- お気に入り登録/解除 ---
    @PostMapping("/{workId}/favorite")
    public Mono<ResponseEntity<Map<String, Boolean>>> toggleFavorite(
            @PathVariable Integer workId,
            @AuthenticationPrincipal User user) {
        
        UserContext context = UserContext.from(user);
        if (!context.isAuthenticated()) return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        
        Long userId = context.userId();
        Integer safeWorkId = Objects.requireNonNull(workId);
        
        return favoriteRepository.existsByUserIdAndBookId(userId, safeWorkId)
            .flatMap(exists -> {
                if (exists) {
                    return favoriteRepository.deleteByUserIdAndBookId(userId, safeWorkId)
                            .thenReturn(ResponseEntity.ok(Map.of("isFavorite", false)));
                } else {
                    return workRepository.findById(safeWorkId)
                        .flatMap(work -> {
                            Integer bId = work.getId();
                            if (bId == null) return Mono.error(new IllegalStateException("Work ID missing"));

                            UserFavorite fav = UserFavorite.builder()
                                .userId(userId)
                                .bookId(bId)
                                .bookTitle(work.getTitle())
                                .authorName(work.getAuthorName())
                                .createdAt(LocalDateTime.now())
                                .build();
                            
                            // ★修正: 生成したfavオブジェクトをrequireNonNullで包んで渡す
                            return favoriteRepository.save(Objects.requireNonNull(fav))
                                .thenReturn(ResponseEntity.ok(Map.of("isFavorite", true)));
                        });
                }
            });
    }

    // --- 検索API ---
    @GetMapping("/search")
    public Flux<BookResponse> search(
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(name = "type", required = false) String type,
            @RequestParam(name = "limit", defaultValue = "50") int limit,
            @RequestParam(name = "offset", defaultValue = "0") int offset,
            @RequestParam(name = "sort", required = false) String sort,
            @AuthenticationPrincipal User user) {
        
        UserContext context = UserContext.from(user);

        Flux<Work> worksFlux;
        if ("translation".equalsIgnoreCase(type)) {
            worksFlux = "length_desc".equals(sort) 
                ? workRepository.findByCategoryOrderByLength("Gutenberg", limit, offset)
                : workRepository.findByCategory("Gutenberg", limit, offset);
        } else {
            if (query == null || query.isEmpty()) return Flux.empty();
            String searchPattern = "%" + query.trim() + "%";
            worksFlux = "length_desc".equals(sort)
                ? workRepository.searchByKeywordOrderByLength(searchPattern, limit, offset)
                : workRepository.searchByKeyword(searchPattern, limit, offset);
        }
        return worksFlux.map(work -> BookResponse.from(work, context.isPremium()));
    }

    // --- ジャンル検索API ---
    @GetMapping("/search/genre")
    public Flux<BookResponse> searchByGenre(
            @RequestParam(name = "q") String genre,
            @RequestParam(name = "limit", defaultValue = "50") int limit,
            @RequestParam(name = "offset", defaultValue = "0") int offset,
            @RequestParam(name = "sort", required = false) String sort,
            @AuthenticationPrincipal User user) {
        
        UserContext context = UserContext.from(user);
        
        String searchPattern = "%" + genre.trim() + "%";
        Flux<Work> worksFlux = "length_desc".equals(sort)
            ? workRepository.findByGenreTagContainingOrderByLength(searchPattern, limit, offset)
            : workRepository.findByGenreTagContaining(searchPattern, limit, offset);
        
        return worksFlux.map(work -> BookResponse.from(work, context.isPremium()));
    }

    // --- サジェストAPI ---
    @GetMapping("/suggest")
    public Flux<BookResponse> suggest(
            @RequestParam(name = "q") String query,
            @AuthenticationPrincipal User user) {
        UserContext context = UserContext.from(user);
        if (query == null || query.trim().length() < 2) return Flux.empty();
        String searchPattern = "%" + query.trim() + "%";
        return workRepository.searchByKeyword(searchPattern, 10, 0)
                .map(work -> BookResponse.from(work, context.isPremium()));
    }

    // --- 静的データAPI ---
    @GetMapping("/authors") public Mono<List<String>> getAuthors() { return workRepository.findTopAuthors().collectList(); }
    @GetMapping("/authors/all") public Mono<List<String>> getAllAuthors() { return workRepository.findAllAuthors().collectList(); }
    
    @GetMapping("/genres")
    public Mono<List<String>> getAllGenres() {
        return workRepository.findAllGenreTags()
            .collectList()
            .map(allTagsList -> {
                Map<String, Long> tagCounts = allTagsList.stream()
                    .filter(Objects::nonNull)
                    .flatMap(str -> Arrays.stream(str.split(",")))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.groupingBy(s -> s, Collectors.counting()));
                
                return tagCounts.entrySet().stream()
                    .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                    .limit(40)
                    .map(Map.Entry::getKey)
                    .collect(Collectors.toList());
            });
    }
}