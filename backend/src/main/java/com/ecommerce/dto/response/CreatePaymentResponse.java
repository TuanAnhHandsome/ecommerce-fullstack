package com.ecommerce.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CreatePaymentResponse {
    private String paymentUrl;
    private String orderCode;
    private BigDecimal amount;
}
