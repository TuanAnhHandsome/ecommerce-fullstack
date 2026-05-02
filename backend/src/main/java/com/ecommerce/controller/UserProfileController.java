package com.ecommerce.controller;

import com.ecommerce.dto.request.ChangePasswordRequest;
import com.ecommerce.dto.request.UpdateProfileRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.ProfileResponse;
import com.ecommerce.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService profileService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse> getProfile(Authentication auth) {
        ProfileResponse profile = profileService.getProfile(auth.getName());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse> updateProfile(
            Authentication auth,
            @Valid @RequestBody UpdateProfileRequest req) {
        ProfileResponse updated = profileService.updateProfile(auth.getName(), req);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse> changePassword(
            Authentication auth,
            @Valid @RequestBody ChangePasswordRequest req) {
        profileService.changePassword(auth.getName(), req);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công"));
    }

    // ── THÊM ENDPOINT NÀY ───────────────────────────────────────
    @PostMapping("/verify-password")
    public ResponseEntity<ApiResponse> verifyPassword(
            Authentication auth,
            @RequestBody Map<String, String> body) {
        String password = body.get("password");
        profileService.verifyPassword(auth.getName(), password);
        return ResponseEntity.ok(ApiResponse.success("Xác thực thành công"));
    }
    // ────────────────────────────────────────────────────────────
}