package com.ecommerce.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class CartItemRequest {
    @NotNull(message = "Sản phẩm không được để trống")
    private Long productId;

    @NotNull
    @Min(value = 1, message = "Số lượng phải >= 1")
    private Integer quantity;
}
