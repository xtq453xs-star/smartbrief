package jp.smartbrief.billing.payment.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Table("processed_stripe_events")
public class ProcessedStripeEvent {
    @Id
    private String eventId;
}