package com.ecommerce.service;

import com.ecommerce.dto.request.CreateReviewRequest;
import com.ecommerce.dto.response.ReviewResponse;
import com.ecommerce.dto.response.ReviewSummaryResponse;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface ReviewService {
    ReviewSummaryResponse getReviews(Long productId, int page, int size, String sortBy);
    ReviewResponse createReview(String email, Long productId,
                                CreateReviewRequest request, List<MultipartFile> images);
    void deleteReview(String email, Long reviewId);
}