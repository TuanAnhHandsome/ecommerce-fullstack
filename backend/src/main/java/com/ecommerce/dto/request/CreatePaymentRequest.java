package com.ecommerce.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class CreatePaymentRequest {
    @NotNull(message = "Order ID không được để trống")
    private Long orderId;
}
