package jp.smartbrief.billing.payment.repository;

import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import jp.smartbrief.billing.payment.domain.ProcessedStripeEvent;

public interface ProcessedStripeEventRepository extends ReactiveCrudRepository<ProcessedStripeEvent, String> {
}