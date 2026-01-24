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
import jp.smartbrief.billing.catalog.dto.RichSearchHit; // ★新しいDTO
import jp.smartbrief.billing.catalog.repository.WorkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;

@Service
@RequiredArgsConstructor
@Slf4j
public class AISearchService {

    private final WorkRepository workRepository;
    private final WebClient webClient = WebClient.create("http://search-api:8081");

    /**
     * ユーザーの感情や意図から作品をベクトル検索し、
     * AIによる推薦理由を付与して返却する。
     */
    public Flux<Work> searchBySemantics(String query) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder.path("/search").queryParam("q", query).build())
                .retrieve()
                .bodyToMono(RichSearchHit[].class)
                .flatMapMany(this::mergeWithDatabaseData)
                .onErrorResume(e -> {
                    log.error("🔥 AI Search failed for query [{}]: {}", query, e.getMessage());
                    return Flux.empty();
                });
    }

    /**
     * Goの検索結果(IDとAIデータ)と、MySQLのマスターデータを結合する。
     * [リーダブルコード] ロジックを分割して可読性を向上。
     */
    private Flux<Work> mergeWithDatabaseData(RichSearchHit[] searchHits) {
        if (searchHits == null || searchHits.length == 0) {
            return Flux.empty();
        }

        // 1. Goから返ってきたIDのリストを抽出
        List<Integer> ids = Arrays.stream(searchHits)
                .map(RichSearchHit::id)
                .filter(Objects::nonNull)
                .toList();

        if (ids.isEmpty()) {
            return Flux.empty();
        }

        // 2. IDをキーにして、Goの全検索データをMap化（検索効率化 O(1)）
        Map<Integer, RichSearchHit> aiDataMap = Arrays.stream(searchHits)
                .filter(hit -> hit.id() != null)
                .collect(Collectors.toMap(RichSearchHit::id, Function.identity()));

        // 3. DBからデータを取得し、AIデータを注入して元の順序で返す
        return workRepository.findAllById(ids)
                .collectList()
                .flatMapMany(dbWorks -> {
                    // DB取得結果もMap化
                    Map<Integer, Work> dbWorkMap = dbWorks.stream()
                            .collect(Collectors.toMap(Work::getId, Function.identity()));

                    // 元の検索順位（idsの順）を維持してストリームを構築
                    return Flux.fromIterable(ids)
                            .filter(dbWorkMap::containsKey)
                            .map(id -> {
                                Work work = dbWorkMap.get(id);
                                RichSearchHit aiData = aiDataMap.get(id);

                                // ★重要: DBのデータに、AIの推論結果をセット（マージ）
                                work.setAiReason(aiData.aiReason());
                                work.setMatchScore(aiData.score());

                                return work;
                            });
                });
    }
}