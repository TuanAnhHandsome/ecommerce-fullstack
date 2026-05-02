package com.ecommerce.controller;

import com.ecommerce.dto.request.AdminUpdateReturnRequest;
import com.ecommerce.dto.request.CreateReturnRequest;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.ReturnResponse;
import com.ecommerce.service.ReturnService;
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
@RequestMapping("/returns")
@RequiredArgsConstructor
public class ReturnController {

    private final ReturnService returnService;

    // ── Customer ──────────────────────────────────────────────────

    /**
     * POST /returns
     * Tạo yêu cầu hoàn hàng — chỉ cho đơn DELIVERED.
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReturnResponse> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateReturnRequest request) {
        return ResponseEntity.ok(
                returnService.create(userDetails.getUsername(), request));
    }

    /**
     * GET /returns/my
     * Danh sách yêu cầu hoàn hàng của khách.
     */
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PageResponse<ReturnResponse>> getMyReturns(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(
                returnService.getMyReturns(userDetails.getUsername(), pageable));
    }

    /**
     * GET /returns/{id}
     * Chi tiết 1 yêu cầu — chỉ chủ yêu cầu mới xem được.
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReturnResponse> getById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(
                returnService.getById(userDetails.getUsername(), id));
    }

    // ── Admin ─────────────────────────────────────────────────────

    /**
     * GET /returns/admin
     * Danh sách tất cả, filter theo status + keyword.
     */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponse<ReturnResponse>> adminList(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false)    String status,
            @RequestParam(required = false)    String keyword) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(
                returnService.adminList(status, keyword, pageable));
    }

    /**
     * PUT /returns/admin/{id}
     * Admin cập nhật trạng thái, ghi chú, số tiền hoàn.
     */
    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReturnResponse> adminUpdate(
            @PathVariable Long id,
            @RequestBody AdminUpdateReturnRequest request) {
        return ResponseEntity.ok(returnService.adminUpdate(id, request));
    }
}
