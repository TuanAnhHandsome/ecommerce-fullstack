package com.ecommerce.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class CreateOrderRequest {

    /**
     * Danh sách CartItem ID mà user chọn thanh toán.
     * Backend chỉ tạo đơn với đúng các item này — không lấy toàn bộ cart.
     * Với luồng Buy Now: truyền null/empty → backend dùng toàn bộ cart (nếu muốn hỗ trợ).
     */
    @NotEmpty(message = "Vui lòng chọn ít nhất 1 sản phẩm")
    private List<Long> cartItemIds;

    @NotBlank(message = "Tên người nhận không được để trống")
    @Size(max = 100)
    private String shippingName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^[0-9]{10,11}$", message = "Số điện thoại không hợp lệ")
    private String shippingPhone;

    @NotBlank(message = "Địa chỉ không được để trống")
    private String shippingAddress;

    private String note;

    @NotBlank(message = "Phương thức thanh toán không được để trống")
    @Pattern(regexp = "^(VNPAY|COD)$", message = "Phương thức thanh toán không hợp lệ")
    private String paymentGateway;

    /** Mã giảm giá — tùy chọn */
    private String couponCode;
}