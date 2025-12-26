package jp.smartbrief.billing;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
    "SPRING_R2DBC_URL=r2dbc:mysql://localhost:3306/test",
    "SPRING_R2DBC_USERNAME=root",
    "SPRING_R2DBC_PASSWORD=password",
    "JWT_SECRET_KEY=dGVzdC1zZWNyZXQta2V5LWZvci10ZXN0aW5nLXB1cnBvc2Utb25seQ==",
    "JWT_EXPIRATION=3600000",
    "STRIPE_API_KEY=test-stripe-api-key-for-testing-only",
    "AOZORA_R2DBC_URL=r2dbc:mysql://localhost:3306/aozora",
    "STRIPE_WEBHOOK_SECRET=test-stripe-webhook-secret-for-testing-only",
    "spring.sql.init.mode=never"
})
class BillingApplicationTests {

	@Test
	void contextLoads() {
	}

}
