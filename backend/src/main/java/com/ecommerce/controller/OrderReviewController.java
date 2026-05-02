package com.ecommerce.controller;

import com.ecommerce.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

/**
 * Endpoints review trong context của một Order cụ thể.
 * Tách riêng vì ReviewController đang map /products/{productId}/reviews.
 */
@RestController
@RequestMapping("/orders/{orderId}/reviews")
@RequiredArgsConstructor
public class OrderReviewController {

    private final ReviewService reviewService;

    /**
     * GET /orders/{orderId}/reviews/reviewed-products
     *
     * Trả về Set<productId> mà user đã review trong order này.
     * OrderDetailPage gọi khi mount để biết item nào hiện "Đã đánh giá".
     */
    @GetMapping("/reviewed-products")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Set<Long>> getReviewedProducts(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                reviewService.getReviewedProductIds(userDetails.getUsername(), orderId)
        );
    }
}
