package com.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateWarrantyRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String productName;

    /** Mã đơn hàng — service sẽ tự tìm Order entity */
    private String orderCode;

    private String serialNumber;

    @NotNull(message = "Loại yêu cầu không được để trống")
    private String type;   // WARRANTY | REPAIR | EXCHANGE | RETURN

    @NotBlank(message = "Mô tả lỗi không được để trống")
    private String description;
}
