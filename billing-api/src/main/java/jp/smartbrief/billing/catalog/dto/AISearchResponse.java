package jp.smartbrief.billing.catalog.dto;

import java.util.List;

public record AISearchResponse(List<ScoredPoint> result) {
    public record ScoredPoint(Long id, Double score) {}
}