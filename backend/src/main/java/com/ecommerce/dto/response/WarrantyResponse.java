package com.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

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

    // Sản phẩm — [MỚI] thêm danh sách items pre-filled từ order
    private String       productName;
    private String       serialNumber;
    private List<String> orderItemNames; // snapshot tên các sản phẩm trong đơn

    // Loại & trạng thái
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