package com.ecommerce.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CartResponse {
    private List<CartItemResponse> items;
    private int totalItems;
    private BigDecimal totalAmount;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CartItemResponse {
        // ── Identifier ─────────────────────────────────────────
        /** ID của CartItem — dùng để update/delete */
        private Long id;

        // ── Product info ────────────────────────────────────────
        private Long productId;
        private String productName;
        private String productSlug;
        private String productImage;

        // ── Variant info (null nếu không có variant) ───────────
        private Long variantId;
        private String sku;
        /**
         * Map các option của variant, ví dụ:
         * { "Màu sắc": "Đỏ", "Kích thước": "XL" }
         */
        private Map<String, String> variantValues;

        // ── Giá ────────────────────────────────────────────────
        private BigDecimal unitPrice;
        /** Giá gốc — để hiển thị gạch ngang nếu đang sale */
        private BigDecimal originalPrice;

        // ── Số lượng ───────────────────────────────────────────
        private Integer quantity;
        private BigDecimal subtotal;
        /** Tồn kho tối đa (để disable nút +) */
        private Integer maxStock;
    }
}