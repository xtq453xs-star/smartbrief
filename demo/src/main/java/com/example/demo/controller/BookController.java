package com.example.demo.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator; // 追加

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
    private final UserBookHistoryRepository historyRepository; // repository名はこれのままいきます
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    // --- ★追加: 人気ランキングAPI ---
    // UserBookHistoryRepository に findTopBookIds() が追加されている前提です
    @GetMapping("/ranking")
    public Flux<BookResponse> getRanking() {
        return historyRepository.findTopBookIds() // Flux<Long> でIDが返ってくると仮定
            // IDをLongからIntegerに変換 (WorkのIDがIntegerのため)
            .map(Long::intValue)
            .collectList()
            .flatMapMany(ids -> {
                if (ids.isEmpty()) {
                    return Flux.empty();
                }
                
                // IDリストを使って本を一括取得
                return workRepository.findAllById(ids)
                    .collectList()
                    .flatMapMany(works -> {
                        // DBから取得した順序はバラバラになる可能性があるため、
                        // 元のランキング(ids)の順序通りに並べ直す
                        works.sort(Comparator.comparingInt(w -> ids.indexOf(w.getId())));
                        return Flux.fromIterable(works);
                    });
            })
            // BookResponse(DTO)に変換して返す
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
            username = jwtUtil.extractUsername(token);
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
                
                // DB(UserBookHistory)はString、WorkはIntegerなので変換する
                history.setBookId(String.valueOf(work.getId())); 
                
                history.setBookTitle(work.getTitle());
                history.setAuthorName(work.getAuthorName());
                history.setViewedAt(LocalDateTime.now());
                
                return historyRepository.save(history)
                    .thenReturn(ResponseEntity.ok(BookResponse.from(work)));
            })
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "作品が見つかりません")));
    }
}