package com.ecommerce.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReturnResponse {

    private Long   id;
    private String returnCode;

    // Khách hàng
    private Long   userId;
    private String userName;
    private String userEmail;

    // Đơn hàng
    private Long   orderId;
    private String orderCode;

    // Trạng thái
    private String status;
    private String statusLabel;

    // Lý do
    private String reason;
    private String reasonLabel;
    private String description;

    // Admin
    private String adminNote;
    private String rejectReason;

    // Hoàn tiền
    private BigDecimal refundAmount;
    private String     refundMethod;

    // Items
    private List<ReturnItemResponse> items;

    // Mốc thời gian
    private LocalDateTime completedAt;
    private LocalDateTime rejectedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ReturnItemResponse {
        private Long       orderItemId;
        private String     productName;
        private String     productImg;
        private String     variantName;
        private String     sku;
        private BigDecimal unitPrice;
        private Integer    quantity;
        private BigDecimal subtotal;
    }
}
