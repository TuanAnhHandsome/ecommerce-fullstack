package com.ecommerce.dto.request;

import lombok.*;
import java.math.BigDecimal;

@Data @NoArgsConstructor @AllArgsConstructor
public class AdminUpdateReturnRequest {

    /** ReturnStatus value — APPROVED | RECEIVED | INSPECTING | REFUNDING | COMPLETED | REJECTED */
    private String status;

    /** Ghi chú nội bộ */
    private String adminNote;

    /** Số tiền hoàn lại (admin điền khi COMPLETED) */
    private BigDecimal refundAmount;

    /** Phương thức hoàn tiền — VD: "VNPAY", "BANK_TRANSFER", "COD_CASH" */
    private String refundMethod;

    /** Lý do từ chối — bắt buộc khi status = REJECTED */
    private String rejectReason;
}