package com.ecommerce.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateReviewRequest {

    @NotNull(message = "Vui lòng chọn số sao")
    @Min(value = 1, message = "Tối thiểu 1 sao")
    @Max(value = 5, message = "Tối đa 5 sao")
    private Integer rating;

    @Size(max = 255, message = "Tiêu đề tối đa 255 ký tự")
    private String title;

    @Size(max = 2000, message = "Nhận xét tối đa 2000 ký tự")
    private String comment;

    /**
     * Bắt buộc khi review từ OrderDetailPage.
     * Backend dùng để xác minh đơn hàng DELIVERED và thuộc về user.
     */
    @NotNull(message = "Thiếu thông tin đơn hàng")
    private Long orderId;
}