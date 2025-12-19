package jp.smartbrief.billing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Smart Brief アプリケーションのメインクラス
 * 
 * Spring Boot アプリケーションのエントリーポイントです。
 * このクラスを実行することでアプリケーションが起動します。
 */
@SpringBootApplication
public class BillingApplication {

	public static void main(String[] args) {
		SpringApplication.run(BillingApplication.class, args);
	}

}