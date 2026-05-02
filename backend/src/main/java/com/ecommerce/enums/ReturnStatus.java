package com.ecommerce.enums;

public enum ReturnStatus {
    PENDING,        // Chờ admin duyệt
    APPROVED,       // Admin đã duyệt — chờ khách gửi hàng
    RECEIVED,       // Đã nhận hàng hoàn về
    INSPECTING,     // Đang kiểm tra chất lượng
    REFUNDING,      // Đang xử lý hoàn tiền
    COMPLETED,      // Hoàn tất
    REJECTED        // Từ chối
}
