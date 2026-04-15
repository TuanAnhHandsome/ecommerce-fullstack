package com.ecommerce.controller;

import com.ecommerce.dto.request.CreateWarrantyRequest;
import com.ecommerce.dto.request.UpdateWarrantyRequest;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.WarrantyResponse;
import com.ecommerce.service.WarrantyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/warranty")
@RequiredArgsConstructor
public class WarrantyController {

    private final WarrantyService warrantyService;

    // ── Customer ─────────────────────────────────────────────────────────────

    /** Tạo yêu cầu bảo hành / sửa chữa / đổi trả */
    @PostMapping
    public ResponseEntity<WarrantyResponse> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateWarrantyRequest request) {
        return ResponseEntity.ok(
            warrantyService.create(userDetails.getUsername(), request));
    }

    /** Khách xem danh sách yêu cầu của mình */
    @GetMapping("/my")
    public ResponseEntity<PageResponse<WarrantyResponse>> getMyRequests(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(
            warrantyService.getMyRequests(userDetails.getUsername(), pageable));
    }

    /** Tra cứu công khai theo mã yêu cầu — không cần đăng nhập */
    @GetMapping("/lookup/{requestCode}")
    public ResponseEntity<WarrantyResponse> lookup(@PathVariable String requestCode) {
        return ResponseEntity.ok(warrantyService.lookup(requestCode));
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponse<WarrantyResponse>> adminList(
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "20")  int size,
            @RequestParam(required = false)     String status,
            @RequestParam(required = false)     String keyword) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(
            warrantyService.adminList(status, keyword, pageable));
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WarrantyResponse> adminUpdate(
            @PathVariable Long id,
            @RequestBody UpdateWarrantyRequest request) {
        return ResponseEntity.ok(warrantyService.adminUpdate(id, request));
    }
}
