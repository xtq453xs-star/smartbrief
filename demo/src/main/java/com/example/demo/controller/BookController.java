package com.example.demo.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.Map; // ★追加

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping; // ★追加
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.UserBookHistory;
import com.example.demo.domain.UserFavorite; // ★追加
import com.example.demo.dto.BookResponse;
import com.example.demo.repository.UserBookHistoryRepository;
import com.example.demo.repository.UserFavoriteRepository; // ★追加
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
    
    // --- 閲覧履歴取得API ---
    @GetMapping("/history")
    public Flux<BookResponse> getHistory(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return Flux.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        }
        String token = authHeader.substring(7);
        String username;
        try {
            username = jwtUtil.extractUsername(token);
        } catch (Exception e) {
            return Flux.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        }
        
        return userRepository.findByUsername(username)
            .flatMapMany(user -> 
                historyRepository.findHistoryByUserId(user.getId())
                    .flatMap(history -> 
                        workRepository.findById(history.getBookId())
                            .map(BookResponse::from)
                    )
            );
    }

    // --- ★追加: お気に入り一覧取得API ---
    @GetMapping("/favorites")
    public Flux<BookResponse> getFavorites(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return Flux.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        }
        String token = authHeader.substring(7);
        String username;
        try {
            username = jwtUtil.extractUsername(token);
        } catch (Exception e) {
            return Flux.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        }

        return userRepository.findByUsername(username)
            .flatMapMany(user -> 
                favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                    .flatMap(fav -> 
                        workRepository.findById(fav.getBookId())
                            .map(BookResponse::from)
                    )
            );
    }

    // --- 検索API (通常検索) ---
    @GetMapping("/search")
    public Flux<BookResponse> search(@RequestParam("q") String query) {
        if (query == null || query.trim().isEmpty()) return Flux.empty();
        String searchPattern = "%" + query.trim() + "%";
        return workRepository.searchByKeyword(searchPattern).map(BookResponse::from);
    }

    // --- サジェスト検索API ---
    @GetMapping("/suggest")
    public Flux<BookResponse> suggest(@RequestParam("q") String query) {
        if (query == null || query.trim().isEmpty()) return Flux.empty();
        String searchPattern = query.trim() + "%";
        return workRepository.suggestByKeyword(searchPattern).map(BookResponse::from);
    }

    // --- 詳細API (回数制限あり) ---
    @GetMapping("/{workId}")
    public Mono<ResponseEntity<BookResponse>> getBookDetail(
            @PathVariable Integer workId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "ログインしてください"));
        }
        
        String token = authHeader.substring(7);
        String username;
        try {
            if (jwtUtil.validateToken(token)) {
                username = jwtUtil.extractUsername(token);
            } else {
                throw new RuntimeException("Invalid token");
            }
        } catch (Exception e) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "無効なトークンです"));
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

    // --- ★追加: お気に入り登録状態チェック ---
    @GetMapping("/{workId}/favorite")
    public Mono<ResponseEntity<Map<String, Boolean>>> checkFavorite(
            @PathVariable Integer workId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        String username = jwtUtil.extractUsername(authHeader.substring(7));

        return userRepository.findByUsername(username)
            .flatMap(user -> favoriteRepository.existsByUserIdAndBookId(user.getId(), workId))
            .map(exists -> ResponseEntity.ok(Map.of("isFavorite", exists)));
    }

    // --- ★追加: お気に入り登録/解除 (トグル) ---
    @PostMapping("/{workId}/favorite")
    public Mono<ResponseEntity<Map<String, Boolean>>> toggleFavorite(
            @PathVariable Integer workId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        String username = jwtUtil.extractUsername(authHeader.substring(7));

        return userRepository.findByUsername(username)
            .flatMap(user -> 
                favoriteRepository.existsByUserIdAndBookId(user.getId(), workId)
                    .flatMap(exists -> {
                        if (exists) {
                            // 既に登録済み -> 削除
                            return favoriteRepository.deleteByUserIdAndBookId(user.getId(), workId)
                                    .thenReturn(ResponseEntity.ok(Map.of("isFavorite", false)));
                        } else {
                            // 未登録 -> 追加 (Work情報を取得してから保存)
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

    // 共通処理 (履歴保存)
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