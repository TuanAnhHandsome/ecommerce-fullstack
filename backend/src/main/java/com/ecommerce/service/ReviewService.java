package com.ecommerce.service;

import com.ecommerce.dto.request.CreateReviewRequest;
import com.ecommerce.dto.response.ReviewResponse;
import com.ecommerce.dto.response.ReviewSummaryResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;

public interface ReviewService {

    ReviewSummaryResponse getReviews(Long productId, int page, int size, String sortBy);

    ReviewResponse createReview(String email, Long productId,
                                CreateReviewRequest request, List<MultipartFile> images);

    void deleteReview(String email, Long reviewId);

    /**
     * Trả về Set productId đã được review trong 1 order bởi user.
     * FE dùng để render trạng thái "Đã đánh giá" / "Đánh giá" per item.
     */
    Set<Long> getReviewedProductIds(String email, Long orderId);
}