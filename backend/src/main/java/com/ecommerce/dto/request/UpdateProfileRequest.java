package com.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @NotBlank(message = "Họ tên không được trống")
    private String fullName;

    @Pattern(regexp = "^[0-9]{10}$", message = "SĐT không hợp lệ (10 chữ số)")
    private String phone;

    private String address;
}
