package com.ecommerce.service;

import com.ecommerce.dto.request.LoginRequest;
import com.ecommerce.dto.request.RegisterRequest;
import com.ecommerce.dto.response.AuthResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(String refreshToken);

    /** Vô hiệu hoá refresh token (xoá bản ghi DB) — được gọi khi người dùng đăng xuất. */
    void logout(String refreshToken);

    void sendOtp(String email);

    boolean verifyOtp(String email, String otp);
}