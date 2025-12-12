package com.example.demo.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.UserBookHistory;
import com.example.demo.domain.UserFavorite;
import com.example.demo.dto.BookResponse;
import com.example.demo.repository.UserBookHistoryRepository;
import com.example.demo.repository.UserFavoriteRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.WorkRepository;
import com.example.demo.util.JwtUtil;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/books")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "https://smartbrief.jp"})
@RequiredArgsConstructor
public class BookController {

    private final WorkRepository workRepository;
    private final UserBookHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final UserFavoriteRepository favoriteRepository;

    // --- 人気ランキングAPI ---
    @GetMapping("/ranking")
    public Flux<BookResponse> getRanking() {
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
            .map(BookResponse::from);
    }

    // --- 人気作家一覧API (トップ20) ---
    @GetMapping("/authors")
    public Mono<List<String>> getAuthors() { 
        return workRepository.findTopAuthors().collectList(); 
    }
    
    // --- 全作家一覧取得API ---
    @GetMapping("/authors/all")
    public Mono<List<String>> getAllAuthors() {
        return workRepository.findAllAuthors().collectList();
    }
    
    // --- ジャンル一覧API ---
    @GetMapping("/genres")
    public Mono<List<String>> getAllGenres() {
        return workRepository.findAllGenreTags()
            .collectList()
            .map(allTagsList -> {
                Map<String, Long> tagCounts = allTagsList.stream()
                    .filter(str -> str != null)
                    .flatMap(str -> Arrays.stream(str.split(",")))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
                return tagCounts.entrySet().stream()
                    .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                    .limit(40)
                    .map(Map.Entry::getKey)
                    .collect(Collectors.toList());
            });
    }

    // --- 閲覧履歴取得API ---
    @GetMapping("/history")
    public Flux<BookResponse> getHistory(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        String username = extractUser(authHeader);
        if (username == null) return Flux.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        
        return userRepository.findByUsername(username)
            .flatMapMany(user -> 
                historyRepository.findHistoryByUserId(user.getId())
                    .flatMap(history -> 
                        workRepository.findById(history.getBookId())
                            .map(BookResponse::from)
                    )
            );
    }

    // --- お気に入り一覧取得API ---
    @GetMapping("/favorites")
    public Flux<BookResponse> getFavorites(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        String username = extractUser(authHeader);
        if (username == null) return Flux.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        return userRepository.findByUsername(username)
            .flatMapMany(user -> 
                favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                    .flatMap(fav -> 
                        workRepository.findById(fav.getBookId())
                            .map(BookResponse::from)
                    )
            );
    }

 // --- 検索API ---
    @GetMapping("/search")
    public Flux<BookResponse> search(
            @RequestParam("q") String query,
            @RequestParam(name = "size", defaultValue = "100") int size) { // sizeを受け取る

        if (query == null || query.trim().isEmpty()) return Flux.empty();
        String searchPattern = "%" + query.trim() + "%";
        
        // ★修正: 第2引数に size を渡す
        return workRepository.searchByKeyword(searchPattern, size).map(BookResponse::from);
    }
    
    // --- ジャンル検索API ---
    @GetMapping("/search/genre")
    public Flux<BookResponse> searchByGenre(
            @RequestParam("q") String genre,
            @RequestParam(name = "size", defaultValue = "100") int size) { // sizeを受け取る

        if (genre == null || genre.trim().isEmpty()) return Flux.empty();
        String searchPattern = "%" + genre.trim() + "%";
        
        // ★修正: 第2引数に size を渡す
        return workRepository.findByGenreTagContaining(searchPattern, size).map(BookResponse::from);
    }

    // --- サジェスト検索API ---
    @GetMapping("/suggest")
    public Flux<BookResponse> suggest(@RequestParam("q") String query) {
        if (query == null || query.trim().isEmpty()) return Flux.empty();
        String searchPattern = query.trim() + "%";
        return workRepository.suggestByKeyword(searchPattern).map(BookResponse::from);
    }

    // --- ★修正: 詳細API (ここを他と同じ手動認証方式に変更！) ---
    @GetMapping("/{workId}")
    public Mono<ResponseEntity<BookResponse>> getBookDetail(
            @PathVariable Integer workId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) { // ★修正
        
        String username = extractUser(authHeader);
        if (username == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "ログイン情報が見つかりません"));
        }

        return userRepository.findByUsername(username)
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found")))
            .flatMap(user -> {
                boolean isPremium = Boolean.TRUE.equals(user.getPremium());
                if (isPremium) {
                    return fetchAndSaveHistory(workId, user.getId());
                } else {
                    LocalDateTime todayStart = LocalDate.now().atStartOfDay();
                    return historyRepository.countByUserIdAndViewedAtAfter(user.getId(), todayStart)
                        .flatMap(count -> {
                            if (count >= 3) {
                                return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "無料会員は1日3回までです。"));
                            }
                            return fetchAndSaveHistory(workId, user.getId());
                        });
                }
            });
    }

    // --- お気に入り登録状態チェック ---
    @GetMapping("/{workId}/favorite")
    public Mono<ResponseEntity<Map<String, Boolean>>> checkFavorite(
            @PathVariable Integer workId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        String username = extractUser(authHeader);
        if (username == null) return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        return userRepository.findByUsername(username)
            .flatMap(user -> favoriteRepository.existsByUserIdAndBookId(user.getId(), workId))
            .map(exists -> ResponseEntity.ok(Map.of("isFavorite", exists)));
    }

    // --- お気に入り登録/解除 ---
    @PostMapping("/{workId}/favorite")
    public Mono<ResponseEntity<Map<String, Boolean>>> toggleFavorite(
            @PathVariable Integer workId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String username = extractUser(authHeader);
        if (username == null) return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        return userRepository.findByUsername(username)
            .flatMap(user -> 
                favoriteRepository.existsByUserIdAndBookId(user.getId(), workId)
                    .flatMap(exists -> {
                        if (exists) {
                            return favoriteRepository.deleteByUserIdAndBookId(user.getId(), workId)
                                    .thenReturn(ResponseEntity.ok(Map.of("isFavorite", false)));
                        } else {
                            return workRepository.findById(workId)
                                .flatMap(work -> {
                                    UserFavorite fav = UserFavorite.builder()
                                        .userId(user.getId())
                                        .bookId(work.getId())
                                        .bookTitle(work.getTitle())
                                        .authorName(work.getAuthorName())
                                        .createdAt(LocalDateTime.now())
                                        .build();
                                    return favoriteRepository.save(fav)
                                        .thenReturn(ResponseEntity.ok(Map.of("isFavorite", true)));
                                });
                        }
                    })
            );
    }

    // --- ヘルパーメソッド: トークンからユーザー名を抽出 ---
    private String extractUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        try {
            String token = authHeader.substring(7);
            if (jwtUtil.validateToken(token)) {
                return jwtUtil.extractUsername(token);
            }
        } catch (Exception e) {
            // ignore
        }
        return null;
    }

    // 共通処理
    private Mono<ResponseEntity<BookResponse>> fetchAndSaveHistory(Integer workId, Long userId) {
        return workRepository.findById(workId)
            .flatMap(work -> {
                UserBookHistory history = new UserBookHistory();
                history.setUserId(userId);
                history.setBookId(work.getId()); 
                history.setBookTitle(work.getTitle());
                history.setAuthorName(work.getAuthorName());
                history.setViewedAt(LocalDateTime.now());
                
                return historyRepository.save(history)
                    .thenReturn(ResponseEntity.ok(BookResponse.from(work)));
            })
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "作品が見つかりません")));
    }
}