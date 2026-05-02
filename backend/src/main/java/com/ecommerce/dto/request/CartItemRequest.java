package com.ecommerce.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class CartItemRequest {

    @NotNull(message = "Sản phẩm không được để trống")
    private Long productId;

    // null = sản phẩm không có variant
    private Long variantId;

    @NotNull
    @Min(value = 1, message = "Số lượng phải >= 1")
    @Max(value = 99, message = "Số lượng tối đa 99")
    private Integer quantity;
}