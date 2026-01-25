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
import jp.smartbrief.billing.catalog.dto.RichSearchHit;
import jp.smartbrief.billing.catalog.repository.WorkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;

@Service
@RequiredArgsConstructor
@Slf4j
public class AISearchService {
     /**

     * ユーザーの感情や意図から作品をベクトル検索し、

     * AIによる推薦理由を付与して返却する。

     */

private final WorkRepository workRepository;
    private final WebClient webClient = WebClient.create("http://search-api:8081");

    public Flux<Work> searchBySemantics(String query) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder.path("/search").queryParam("q", query).build())
                .retrieve()
                .bodyToMono(RichSearchHit[].class)
                .flatMapMany(this::mergeWithDatabaseData)
                .onErrorResume(e -> {
                    log.error("🔥 AI Search API Error: {}", e.getMessage());
                    return Flux.empty();
                });
    }

    private Flux<Work> mergeWithDatabaseData(RichSearchHit[] searchHits) {
        if (searchHits == null || searchHits.length == 0) return Flux.empty();

        // 1. nullを除去してIDリストを作成
        List<Long> longIds = Arrays.stream(searchHits)
                .map(RichSearchHit::id)
                .filter(Objects::nonNull)
                .toList();

        if (longIds.isEmpty()) return Flux.empty();

        // 2. マッピング用のデータ保持
        Map<Long, RichSearchHit> aiDataMap = Arrays.stream(searchHits)
                .filter(hit -> hit.id() != null)
                .collect(Collectors.toMap(RichSearchHit::id, Function.identity()));

        // 3. MySQL検索用のIntegerリスト作成 (Nullを除去し、List.copyOfで不変・非nullを保証)
        List<Integer> intIds = longIds.stream()
                .map(Long::intValue)
                .filter(Objects::nonNull)
                .collect(Collectors.collectingAndThen(Collectors.toList(), List::copyOf));

        // ★ 修正箇所: Objects.requireNonNull を使用して Null type safety 警告を解消
        return workRepository.findAllById(Objects.requireNonNull(intIds))
                .collectList()
                .flatMapMany(dbWorks -> {
                    Map<Integer, Work> dbWorkMap = dbWorks.stream()
                            .filter(Objects::nonNull)
                            .collect(Collectors.toMap(Work::getId, Function.identity()));

                    return Flux.fromIterable(longIds)
                            .map(longId -> {
                                Integer intId = (longId != null) ? longId.intValue() : null;
                                if (intId == null) return null;

                                Work work = dbWorkMap.get(intId);
                                if (work != null) {
                                    RichSearchHit aiData = aiDataMap.get(longId);
                                    if (aiData != null) {
                                        work.setAiReason(aiData.aiReason());
                                        work.setMatchScore(aiData.score());
                                    }
                                    return work;
                                }
                                return null;
                            })
                            .filter(Objects::nonNull);
                });
    }
}