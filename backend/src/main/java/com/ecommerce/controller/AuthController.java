package com.ecommerce.controller;

import com.ecommerce.dto.request.LoginRequest;
import com.ecommerce.dto.request.RegisterRequest;
import com.ecommerce.dto.request.SendOtpRequest;
import com.ecommerce.dto.request.VerifyOtpRequest;
import com.ecommerce.dto.response.AuthResponse;
import com.ecommerce.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * ⚠️ THAY ĐỔI QUAN TRỌNG so với trước:
 * refreshToken KHÔNG còn được gửi/nhận qua JSON body nữa. Trước đây frontend tự
 * gửi refreshToken lên trong body — nghĩa là JS có toàn quyền đọc/ghi giá trị này,
 * nên nếu site dính XSS thì refreshToken (sống rất lâu) bị đánh cắp cũng dễ như
 * accessToken. Giờ refreshToken nằm trong cookie `httpOnly` — trình duyệt tự đính
 * kèm khi gọi API, nhưng JavaScript (kể cả code độc từ XSS) không đọc được giá trị.
 *
 * Frontend cần gọi API với `withCredentials: true` để cookie được gửi kèm.
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "refreshToken";

    private final AuthService authService;

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${app.cookie.same-site:Lax}")
    private String cookieSameSite;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpirationMs;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return withRefreshCookie(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return withRefreshCookie(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken) {
        return withRefreshCookie(authService.refreshToken(refreshToken));
    }

    /** Endpoint MỚI — trước đây chưa có logout thật ở backend (frontend chỉ tự xoá localStorage). */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken) {
        authService.logout(refreshToken);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie("", 0).toString())
                .body(Map.of("message", "Đăng xuất thành công"));
    }

    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, String>> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        authService.sendOtp(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "Mã OTP đã được gửi đến email của bạn"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, String>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        boolean ok = authService.verifyOtp(request.getEmail(), request.getOtp());
        if (!ok) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Mã OTP không đúng hoặc đã hết hạn"));
        }
        return ResponseEntity.ok(Map.of("message", "Xác thực thành công"));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private ResponseEntity<AuthResponse> withRefreshCookie(AuthResponse response) {
        String refreshToken = response.getRefreshToken();
        // Không trả refreshToken trong JSON body — chỉ gửi qua cookie httpOnly.
        response.setRefreshToken(null);

        ResponseCookie cookie = buildRefreshCookie(refreshToken, refreshTokenExpirationMs / 1000);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    private ResponseCookie buildRefreshCookie(String value, long maxAgeSeconds) {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, value == null ? "" : value)
                .httpOnly(true)
                .secure(cookieSecure)     // true ở production (HTTPS); false khi dev local qua http
                .sameSite(cookieSameSite) // "Lax" đủ dùng khi FE gọi qua Vite proxy (cùng-origin từ browser).
                                          // Nếu FE và BE nằm ở domain khác nhau (không qua proxy) ở production,
                                          // phải đổi thành "None" và cookieSecure=true (bắt buộc kèm nhau).
                .path("/api/auth")
                .maxAge(maxAgeSeconds)
                .build();
    }
}
