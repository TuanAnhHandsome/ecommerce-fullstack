package com.ecommerce.dto.response;

import lombok.*;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ImportResultResponse {

    private int totalGroups;      // tổng số sản phẩm (nhóm theo Mã tạm) trong file
    private int successCount;
    private int errorCount;

    private List<ImportedItem> imported;
    private List<ImportErrorItem> errors;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ImportedItem {
        private String tempCode;     // Mã tạm trong file Excel
        private Long productId;      // null nếu đang ở chế độ preview (dry-run)
        private String name;
        private int variantCount;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ImportErrorItem {
        private String sheet;        // "SanPham" | "BienThe" | "ThongSo"
        private Integer rowNumber;   // số dòng trong sheet (tính cả header)
        private String tempCode;
        private String message;
    }
}
