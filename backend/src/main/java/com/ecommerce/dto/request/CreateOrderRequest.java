package com.ecommerce.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class CreateOrderRequest {
    @NotBlank(message = "Tên người nhận không được để trống")
    @Size(max = 100)
    private String shippingName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Size(max = 20)
    private String shippingPhone;

    @NotBlank(message = "Địa chỉ không được để trống")
    private String shippingAddress;

    private String note;

    @NotBlank(message = "Phương thức thanh toán không được để trống")
    private String paymentGateway; // "VNPAY" hoặc "COD"
}
