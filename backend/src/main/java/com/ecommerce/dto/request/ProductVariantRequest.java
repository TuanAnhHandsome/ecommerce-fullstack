package com.ecommerce.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class ProductVariantRequest {

    @NotEmpty
    private List<VariantOptionDto> options;

    @NotEmpty
    private List<VariantSkuDto> skus;

    // ─── Option (loại biến thể: Màu sắc, RAM…) ───────────────────────────
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class VariantOptionDto {
        private Long id;            // null = INSERT, có giá trị = UPDATE
        @NotBlank private String name;
        private Integer sortOrder;
        @NotEmpty private List<VariantValueDto> values;
    }

    // ─── Value (giá trị: Đen, 8GB…) ──────────────────────────────────────
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class VariantValueDto {
        private Long id;            // null = INSERT, có giá trị = UPDATE
        @NotBlank private String value;
        private Integer sortOrder;
    }

    // ─── SKU (tổ hợp biến thể cụ thể) ────────────────────────────────────
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class VariantSkuDto {
        private Long id;            // null = INSERT, có giá trị = UPDATE
        private Boolean deleted = false;  // true = xóa SKU này

        private String sku;

        // price/stockQty có thể null khi deleted=true
        private BigDecimal price;
        private BigDecimal salePrice;

        @Min(0)
        private Integer stockQty;

        private Boolean active = true;
        private Integer sortOrder;

        @NotEmpty
        private List<String> valueLabels;

        /**
         * Danh sách URL ảnh cũ cần GIỮ LẠI.
         * URL nào không có trong list này → xóa khỏi variant_images.
         * List rỗng = xóa hết ảnh cũ.
         */
        private List<String> keepImageUrls = List.of();
    }
}