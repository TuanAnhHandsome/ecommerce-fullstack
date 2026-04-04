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

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RevenueByDay {
        private String date;
        private BigDecimal revenue;
        private Long orders;
    }
}
