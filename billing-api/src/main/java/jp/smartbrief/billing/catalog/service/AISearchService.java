package jp.smartbrief.billing.catalog.service;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import jp.smartbrief.billing.catalog.domain.Work;
import jp.smartbrief.billing.catalog.dto.AISearchResponse.ScoredPoint;
import jp.smartbrief.billing.catalog.repository.WorkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; // ★ログ用に必要
import reactor.core.publisher.Flux;

@Service
@RequiredArgsConstructor
@Slf4j // ★追加
public class AISearchService {

    private final WorkRepository workRepository;
    private final WebClient webClient = WebClient.create("http://search-api:8081");

    public Flux<Work> searchBySemantics(String query) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder.path("/search")
                        .queryParam("q", query)
                        .build())
                .retrieve()
                // ★修正のハイライト: 生のStringではなく、DTOの配列として直接受け取る
                .bodyToMono(ScoredPoint[].class)
                .flatMapMany(points -> {
                    if (points == null || points.length == 0) {
                        return Flux.empty();
                    }

                    // GoからのレスポンスをそのままIDリストに変換
                    List<Integer> ids = Arrays.stream(points)
                        .map(p -> {
                           Long val = p.getIdAsLong();
                           return (val != null) ? val.intValue() : null;
                       })
                        .filter(Objects::nonNull)
                        .toList();

                        // ★ここを追加！: IDが1件も無ければ、DBにアクセスせず空を返す
                        if (ids.isEmpty()) {
                        return Flux.empty();
                    }
                    // DBからデータを取得し、ベクトルのスコア順（元の順序）を維持して返す
                    return workRepository.findAllById(ids)
                            .collectList()
                            .flatMapMany(works -> {
                                Map<Integer, Work> workMap = works.stream()
                                        .collect(Collectors.toMap(Work::getId, Function.identity()));

                                return Flux.fromIterable(ids)
                                        .filter(workMap::containsKey)
                                        .map(workMap::get);
                            });
                })
                // ★追加: エラー時の安全なフォールバック
                .onErrorResume(e -> {
                    log.error("🔥 AI Search failed: {}", e.getMessage());
                    return Flux.empty();
                });
    }
}