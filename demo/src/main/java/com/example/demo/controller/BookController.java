package com.example.demo.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.UserBookHistory;
import com.example.demo.dto.BookResponse;
import com.example.demo.repository.UserBookHistoryRepository;
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

    // --- ★追加: 人気ランキングAPI ---
    @GetMapping("/ranking")
    public Flux<BookResponse> getRanking() {
        // 閲覧数が多い順に book_id を取得
        return historyRepository.findTopBookIds()
            .collectList()
            .flatMapMany(ids -> {
                if (ids.isEmpty()) {
                    return Flux.empty();
                }
                
                // IDリストを使って本を一括取得
                return workRepository.findAllById(ids)
                    .collectList()
                    .flatMapMany(works -> {
                        // DB取得順は保証されないため、ランキングID順に並べ直す
                        works.sort(Comparator.comparingInt(w -> ids.indexOf(w.getId())));
                        return Flux.fromIterable(works);
                    });
            })
            .map(BookResponse::from);
    }

    // --- 検索API (通常検索) ---
    @GetMapping("/search")
    public Flux<BookResponse> search(@RequestParam("q") String query) {
        if (query == null || query.trim().isEmpty()) {
            return Flux.empty();
        }
        String searchPattern = "%" + query.trim() + "%";
        return workRepository.searchByKeyword(searchPattern)
                .map(BookResponse::from);
    }

    // --- サジェスト検索API ---
    @GetMapping("/suggest")
    public Flux<BookResponse> suggest(@RequestParam("q") String query) {
        if (query == null || query.trim().isEmpty()) {
            return Flux.empty();
        }
        String searchPattern = query.trim() + "%";
        return workRepository.suggestByKeyword(searchPattern)
                .map(BookResponse::from);
    }

    // --- 詳細API (回数制限あり) ---
    @GetMapping("/{workId}")
    public Mono<ResponseEntity<BookResponse>> getBookDetail(
            @PathVariable Integer workId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // 1. トークンチェック
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "ログインしてください"));
        }
        
        // 2. トークン解析
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

        // 3. ユーザー取得と処理
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

    // 共通処理
    private Mono<ResponseEntity<BookResponse>> fetchAndSaveHistory(Integer workId, Long userId) {
        return workRepository.findById(workId)
            .flatMap(work -> {
                UserBookHistory history = new UserBookHistory();
                history.setUserId(userId);
                
                // ★修正: 前回 String -> Integer に変更したので、そのままセットする
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