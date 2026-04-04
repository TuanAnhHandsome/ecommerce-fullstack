package com.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequest {

    @NotBlank(message = "Mật khẩu hiện tại không được trống")
    private String currentPassword;

    @NotBlank
    @Size(min = 6, message = "Mật khẩu mới tối thiểu 6 ký tự")
    private String newPassword;

    @NotBlank(message = "Xác nhận mật khẩu không được trống")
    private String confirmPassword;
}
