// FILE: payment/vnpay/VNPayConfig.java
// ================================================================
package com.ecommerce.payment.vnpay;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class VNPayConfig {

    @Value("${vnpay.tmn-code}")        private String tmnCode;
    @Value("${vnpay.hash-secret}")     private String hashSecret;
    @Value("${vnpay.pay-url}")         private String payUrl;
    @Value("${vnpay.return-url}")      private String returnUrl;
    @Value("${vnpay.version}")         private String version;
    @Value("${vnpay.command}")         private String command;
    @Value("${vnpay.order-type}")      private String orderType;
    @Value("${vnpay.locale}")          private String locale;
    @Value("${vnpay.curr-code}")       private String currCode;
    @Value("${vnpay.ipn-url}")         private String ipnUrl;
}
