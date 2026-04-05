package com.ecommerce.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductResponse {

    private Long id;
    private Long categoryId;
    private String categoryName;
    private String name;
    private String slug;
    private String description;
    private BigDecimal price;
    private BigDecimal salePrice;
    private BigDecimal effectivePrice;
    private Integer stockQty;
    private String imageUrl;
    private List<String> images;
    private String sku;
    private Boolean active;
    private LocalDateTime createdAt;

    private Double avgRating;
    private Integer reviewCount;
    private Integer soldCount;

    private List<VariantOptionResponse> variantOptions;
    private List<VariantSkuResponse> variants;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class VariantOptionResponse {
        private Long id;
        private String name;
        private Integer sortOrder;
        private List<ValueItem> values;

        @Data @Builder @NoArgsConstructor @AllArgsConstructor
        public static class ValueItem {
            private Long id;
            private String value;
            private Integer sortOrder;
        }
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class VariantSkuResponse {
        private Long id;
        private String sku;
        private BigDecimal price;
        private BigDecimal salePrice;
        private BigDecimal effectivePrice;
        private Integer stockQty;
        private Boolean active;
        private Integer sortOrder;
        private List<String> valueLabels;
        private List<String> images;
    }
}