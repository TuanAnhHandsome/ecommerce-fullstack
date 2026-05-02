package com.ecommerce.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OrderResponse {
    private Long id;
    private String orderCode;
    private Long userId;
    private String userName;
    private BigDecimal totalAmount;
    private BigDecimal shippingFee;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private String status;
    private String shippingName;
    private String shippingPhone;
    private String shippingAddress;
    private String note;
    private List<OrderItemResponse> orderItems;
    private PaymentInfo payment;
    private LocalDateTime createdAt;
    private String cancelReason;
    private LocalDateTime cancelledAt;
    private String cancelledBy;
    private String couponCode;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class OrderItemResponse {
        private Long id;
        private Long productId;
        private String productName;
        private String productImg;
        /** null nếu không có variant */
        private Long variantId;
        /** Tên variant hiển thị, ví dụ "Màu: Đỏ / Size: XL" */
        private String variantName;
        private String sku;
        private BigDecimal unitPrice;
        private Integer quantity;
        private BigDecimal subtotal;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PaymentInfo {
        private String gateway;
        private String status;
        private LocalDateTime paidAt;
    }
}