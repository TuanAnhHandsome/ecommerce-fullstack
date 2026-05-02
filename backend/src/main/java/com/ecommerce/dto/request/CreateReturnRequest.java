package com.ecommerce.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class CreateReturnRequest {

    /** ID đơn hàng — backend verify DELIVERED + thuộc về user */
    @NotNull(message = "Thiếu thông tin đơn hàng")
    private Long orderId;

    /** Lý do enum — WRONG_ITEM | DEFECTIVE | NOT_AS_DESCRIBED | CHANGED_MIND | MISSING_PARTS | OTHER */
    @NotBlank(message = "Vui lòng chọn lý do hoàn hàng")
    private String reason;

    /** Mô tả chi tiết */
    @NotBlank(message = "Vui lòng mô tả vấn đề")
    @Size(max = 2000)
    private String description;

    /** Danh sách sản phẩm muốn hoàn (ít nhất 1) */
    @NotEmpty(message = "Vui lòng chọn ít nhất 1 sản phẩm")
    @Valid
    private List<ReturnItemRequest> items;

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ReturnItemRequest {

        @NotNull(message = "Thiếu orderItemId")
        private Long orderItemId;

        @NotNull(message = "Số lượng không được để trống")
        @Min(value = 1, message = "Số lượng tối thiểu là 1")
        private Integer quantity;
    }
}
