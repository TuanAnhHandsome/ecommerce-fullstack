package com.ecommerce.controller;

import com.ecommerce.dto.request.CreateReviewRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.ReviewResponse;
import com.ecommerce.dto.response.ReviewSummaryResponse;
import com.ecommerce.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/products/{productId}/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * GET /products/{productId}/reviews
     * Public — lấy danh sách review + summary của 1 product.
     */
    @GetMapping
    public ResponseEntity<ReviewSummaryResponse> getReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0")         int page,
            @RequestParam(defaultValue = "10")        int size,
            @RequestParam(defaultValue = "createdAt") String sortBy) {
        return ResponseEntity.ok(reviewService.getReviews(productId, page, size, sortBy));
    }

    /**
     * POST /products/{productId}/reviews
     * Authenticated — tạo review (multipart: JSON part "review" + file part "images").
     * Backend tự verify order DELIVERED qua orderId trong request body.
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReviewResponse> createReview(
            @PathVariable Long productId,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestPart("review") CreateReviewRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        return ResponseEntity.ok(
                reviewService.createReview(userDetails.getUsername(), productId, request, images)
        );
    }

    /**
     * DELETE /products/{productId}/reviews/{reviewId}
     * Authenticated — chỉ chủ review mới được xoá.
     */
    @DeleteMapping("/{reviewId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse> deleteReview(
            @PathVariable Long productId,
            @PathVariable Long reviewId,
            @AuthenticationPrincipal UserDetails userDetails) {
        reviewService.deleteReview(userDetails.getUsername(), reviewId);
        return ResponseEntity.ok(ApiResponse.success("Đã xoá đánh giá"));
    }
}