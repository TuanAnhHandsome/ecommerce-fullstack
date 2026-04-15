package com.ecommerce.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateWarrantyRequest {

    /** WarrantyStatus value — VD: "RECEIVED", "REPAIRING", "DONE" */
    private String status;

    /** Ghi chú nội bộ từ admin (khách không thấy) */
    private String adminNote;

    /** Ngày dự kiến trả máy */
    private LocalDateTime estimatedReturnDate;
}
