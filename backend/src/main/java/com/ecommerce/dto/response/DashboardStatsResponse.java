package com.ecommerce.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DashboardStatsResponse {
    private Long totalUsers;
    private Long totalOrders;
    private Long totalProducts;
    private BigDecimal totalRevenue;
    private Long pendingOrders;
    private Long todayOrders;
    private BigDecimal todayRevenue;
    private List<RevenueByDay> revenueByDay;

    // ── MỚI ──────────────────────────────────────────────
    private List<TopProduct>   topSellingProducts;
    private List<LowStockItem> lowStockProducts;
    // ─────────────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RevenueByDay {
        private String date;
        private BigDecimal revenue;
        private Long orders;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TopProduct {
        private Long   productId;
        private String productName;
        private String imageUrl;
        private Long   totalSold;
        private BigDecimal totalRevenue;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class LowStockItem {
        private Long   productId;
        private String productName;
        private String imageUrl;
        private Integer stockQty;
        private String  sku;
    }
}