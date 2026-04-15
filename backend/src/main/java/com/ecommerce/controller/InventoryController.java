package com.ecommerce.controller;

import com.ecommerce.dto.request.StockRequest;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.StockTransactionResponse;
import com.ecommerce.service.InventoryService;
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
@RequestMapping("/inventory")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    /** Xem tất cả giao dịch kho */
    @GetMapping
    public ResponseEntity<PageResponse<StockTransactionResponse>> listAll(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false)    String keyword) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(inventoryService.listAll(keyword, pageable));
    }

    /** Lịch sử giao dịch của 1 sản phẩm */
    @GetMapping("/product/{productId}")
    public ResponseEntity<PageResponse<StockTransactionResponse>> listByProduct(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        var pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(inventoryService.listByProduct(productId, pageable));
    }

    /** Nhập / xuất / điều chỉnh kho */
    @PostMapping
    public ResponseEntity<StockTransactionResponse> addTransaction(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody StockRequest request) {
        return ResponseEntity.ok(
            inventoryService.addTransaction(userDetails.getUsername(), request));
    }
}
