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

    /**
     * Dùng trong flow cũ (form standalone) — nhập tay mã đơn hàng.
     * Service tự tìm Order entity theo orderCode.
     * Không bắt buộc — khách có thể không nhớ mã đơn.
     */
    private String orderCode;

    /**
     * [MỚI] Dùng trong flow từ OrderDetailPage — truyền trực tiếp orderId.
     * Nếu có orderId thì ưu tiên dùng thay vì orderCode.
     * Backend sẽ verify: order phải DELIVERED và thuộc về user.
     */
    private Long orderId;

    private String serialNumber;

    @NotNull(message = "Loại yêu cầu không được để trống")
    private String type;   // WARRANTY | REPAIR | EXCHANGE | RETURN

    @NotBlank(message = "Mô tả vấn đề không được để trống")
    private String description;
}