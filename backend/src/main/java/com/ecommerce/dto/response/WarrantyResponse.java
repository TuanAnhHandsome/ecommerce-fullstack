package com.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarrantyResponse {

    private Long   id;
    private String requestCode;

    // Khách hàng
    private Long   userId;
    private String userName;
    private String userEmail;
    private String userPhone;

    // Đơn hàng liên quan
    private Long   orderId;
    private String orderCode;

    // Sản phẩm
    private String productName;
    private String serialNumber;

    // Loại & trạng thái (enum name + label tiếng Việt)
    private String type;
    private String typeLabel;
    private String status;
    private String statusLabel;

    // Nội dung
    private String description;
    private String adminNote;

    // Mốc thời gian
    private LocalDateTime estimatedReturnDate;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
