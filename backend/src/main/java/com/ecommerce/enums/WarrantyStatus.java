package com.ecommerce.enums;

public enum WarrantyStatus {
    PENDING,       // Chờ tiếp nhận
    RECEIVED,      // Đã tiếp nhận máy
    DIAGNOSING,    // Đang kiểm tra / chẩn đoán
    REPAIRING,     // Đang sửa chữa
    WAITING_PART,  // Chờ linh kiện
    DONE,          // Hoàn thành — chờ khách lấy
    RETURNED,      // Đã trả khách
    REJECTED       // Từ chối (hết bảo hành / lỗi người dùng)
}
