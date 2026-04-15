package com.ecommerce.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class ProductRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 255)
    private String name;

    @NotNull(message = "Danh mục không được để trống")
    private Long categoryId;

    private String description;

    @NotNull(message = "Giá không được để trống")
    @DecimalMin(value = "0", message = "Giá phải lớn hơn 0")
    private BigDecimal price;

    @DecimalMin(value = "0", message = "Giá khuyến mãi phải lớn hơn 0")
    private BigDecimal salePrice;

    @NotNull
    @Min(value = 0, message = "Số lượng phải >= 0")
    private Integer stockQty;

    @Size(max = 100)
    private String sku;

    private Boolean active = true;

    /** IDs ảnh cũ cần xóa */
    private List<Long> deletedImageIds;

    // ── MỚI: Thông số kỹ thuật ───────────────────────────────────────────────
    /**
     * Danh sách thông số kỹ thuật.
     * Frontend gửi toàn bộ list → backend replace-all.
     */
    private List<SpecItem> specs;

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class SpecItem {
        /** Nhóm — VD: "Cấu hình", "Màn hình" */
        @NotBlank
        private String group;

        /** Tên thông số — VD: "CPU", "RAM" */
        @NotBlank
        private String key;

        /** Giá trị — VD: "Apple A17 Pro", "8 GB" */
        @NotBlank
        private String value;

        private Integer sortOrder;
    }
}