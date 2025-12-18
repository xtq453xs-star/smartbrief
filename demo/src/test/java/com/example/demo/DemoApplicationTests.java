package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
    "SPRING_R2DBC_URL=r2dbc:mysql://localhost:3306/test",
    "SPRING_R2DBC_USERNAME=root",
    "SPRING_R2DBC_PASSWORD=password",
    "JWT_SECRET_KEY=test-secret-key-for-testing-purpose-only"
})
class DemoApplicationTests {

	@Test
	void contextLoads() {
	}

}
