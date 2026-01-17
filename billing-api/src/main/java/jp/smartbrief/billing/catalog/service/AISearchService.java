package jp.smartbrief.billing.catalog.service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import jp.smartbrief.billing.catalog.domain.Work;
import jp.smartbrief.billing.catalog.dto.AISearchResponse;
import jp.smartbrief.billing.catalog.repository.WorkRepository;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;

@Service
@RequiredArgsConstructor
public class AISearchService {

    private final WorkRepository workRepository;
    // Docker内でのGoサービスのホスト名: search_api_go (docker-composeのcontainer_name) または search-api (service名)
    // ここではサービス名の "search-api" を使います
    private final WebClient webClient = WebClient.create("http://search-api:8081");

    public Flux<Work> searchBySemantics(String query) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder.path("/search")
                        .queryParam("q", query)
                        .build())
                .retrieve()
                .bodyToMono(AISearchResponse.class)
                .flatMapMany(response -> {
                    if (response.result() == null || response.result().isEmpty()) {
                        return Flux.empty();
                    }

                    // 1. Goから返ってきた ID と スコア のリスト
                    List<AISearchResponse.ScoredPoint> points = response.result();
                    List<Integer> ids = points.stream()
                            .map(p -> p.id().intValue())
                            .toList();

                    // 2. MySQLから詳細情報を一括取得 (順不同)
                    return workRepository.findAllById(ids)
                            .collectList()
                            .flatMapMany(works -> {
                                // 3. Goのスコア順(元のIDリストの順序)に並べ直す
                                Map<Integer, Work> workMap = works.stream()
                                        .collect(Collectors.toMap(Work::getId, Function.identity()));

                                // IDリストの順番通りにWorkオブジェクトを並べて返す
                                return Flux.fromIterable(ids)
                                        .filter(workMap::containsKey)
                                        .map(workMap::get);
                            });
                });
    }
}