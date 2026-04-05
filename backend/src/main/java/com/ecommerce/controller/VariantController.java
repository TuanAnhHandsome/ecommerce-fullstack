package com.ecommerce.controller;

import com.ecommerce.dto.request.ProductVariantRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.service.VariantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import java.util.*;

@RestController
@RequestMapping("/products/{productId}/variants")
@RequiredArgsConstructor
public class VariantController {

    private final VariantService variantService;

    // ─── GET /products/{id}/variants ──────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<ProductResponse.VariantSkuResponse>> getVariants(
            @PathVariable Long productId) {
        return ResponseEntity.ok(variantService.getVariants(productId));
    }

    // ─── POST /products/{id}/variants ─────────────────────────────────────
    /**
     * Frontend gửi FormData với:
     *   - data  : JSON blob (ProductVariantRequest)
     *   - images[<key>], images[<key>], … : file ảnh, mỗi SKU 1 key riêng
     *
     * Dùng MultipartHttpServletRequest thay vì Map<String,List<MultipartFile>>
     * vì Spring MVC không tự resolve nested bracket key thành Map.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> saveVariants(
            @PathVariable Long productId,
            @RequestPart("data") ProductVariantRequest request,
            MultipartHttpServletRequest httpRequest) {

        // Thu thập ảnh: key = "images[xxx]" → Map<"xxx", List<File>>
        Map<String, List<MultipartFile>> imagesByKey = new HashMap<>();
        httpRequest.getMultiFileMap().forEach((paramName, files) -> {
            if (paramName.startsWith("images[") && paramName.endsWith("]")) {
                String key = paramName.substring(7, paramName.length() - 1);
                imagesByKey.put(key, files);
            }
        });

        variantService.saveVariants(productId, request, imagesByKey);
        return ResponseEntity.ok(ApiResponse.success("Lưu biến thể thành công"));
    }

    // ─── DELETE /products/{id}/variants ───────────────────────────────────
    @DeleteMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> deleteAllVariants(@PathVariable Long productId) {
        variantService.deleteAllVariants(productId);
        return ResponseEntity.ok(ApiResponse.success("Đã xoá biến thể"));
    }
}