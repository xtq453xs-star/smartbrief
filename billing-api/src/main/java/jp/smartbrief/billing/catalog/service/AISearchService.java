package jp.smartbrief.billing.catalog.service;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.ObjectMapper; // ★追加

import jp.smartbrief.billing.catalog.domain.Work;
import jp.smartbrief.billing.catalog.dto.AISearchResponse;
import jp.smartbrief.billing.catalog.dto.AISearchResponse.ScoredPoint;
import jp.smartbrief.billing.catalog.repository.WorkRepository;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;

@Service
@RequiredArgsConstructor
public class AISearchService {

    private final WorkRepository workRepository;
    private final WebClient webClient = WebClient.create("http://search-api:8081");
    private final ObjectMapper objectMapper = new ObjectMapper(); // ★JSON解析機

    public Flux<Work> searchBySemantics(String query) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder.path("/search")
                        .queryParam("q", query)
                        .build())
                .retrieve()
                // ★修正: 型を決めつけず、まずは「生の文字列」として受け取る
                .bodyToMono(String.class)
                .flatMapMany(json -> {
                    // ログに出すので、何が起きているか一目瞭然になります
                    System.out.println("🔍 Go Search Response: " + json);

                    List<ScoredPoint> points;
                    try {
                        // ★ここが最強ポイント: 先頭の文字で判定！
                        if (json.trim().startsWith("[")) {
                            // 配列 [...] なら
                            ScoredPoint[] array = objectMapper.readValue(json, ScoredPoint[].class);
                            points = Arrays.asList(array);
                        } else {
                            // オブジェクト {...} なら
                            AISearchResponse response = objectMapper.readValue(json, AISearchResponse.class);
                            points = response.result();
                        }
                    } catch (Exception e) {
                        System.err.println("🔥 JSON Parse Error: " + e.getMessage());
                        return Flux.error(e);
                    }

                    if (points == null || points.isEmpty()) {
                        return Flux.empty();
                    }

                    // --- ここからは共通ロジック ---
                    List<Integer> ids = points.stream()
                            // ★修正: p.id() ではなく、自作した p.getIdAsLong() を使う
                            .map(p -> {
                                Long val = p.getIdAsLong();
                                return (val != null) ? val.intValue() : null;
                            })
                            .filter(id -> id != null) // nullは除外
                            .toList();
                            
                    return workRepository.findAllById(ids)
                            .collectList()
                            .flatMapMany(works -> {
                                Map<Integer, Work> workMap = works.stream()
                                        .collect(Collectors.toMap(Work::getId, Function.identity()));

                                return Flux.fromIterable(ids)
                                        .filter(workMap::containsKey)
                                        .map(workMap::get);
                            });
                });
    }
}