package com.ecommerce.service.impl;

import com.ecommerce.dto.request.CreateReviewRequest;
import com.ecommerce.dto.response.ReviewResponse;
import com.ecommerce.dto.response.ReviewSummaryResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.BusinessException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.*;
import com.ecommerce.service.CloudinaryService;
import com.ecommerce.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewImageRepository reviewImageRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final CloudinaryService cloudinaryService;

    @Override
    @Transactional(readOnly = true)
    public ReviewSummaryResponse getReviews(Long productId, int page, int size, String sortBy) {
        PageRequest pageable = PageRequest.of(page, size,
                Sort.Direction.DESC, sortBy.equals("rating") ? "rating" : "createdAt");

        Page<Review> reviewPage = reviewRepository.findByProductId(productId, pageable);

        Double avg = reviewRepository.avgRatingByProduct(productId);
        Integer total = reviewRepository.countByProduct(productId);

        // Build distribution map {5→143, 4→59, ...}
        Map<Integer, Long> dist = new LinkedHashMap<>();
        for (int i = 5; i >= 1; i--) dist.put(i, 0L);
        reviewRepository.countByRatingForProduct(productId)
                .forEach(row -> dist.put(((Number) row[0]).intValue(), (Long) row[1]));

        return ReviewSummaryResponse.builder()
                .avgRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0)
                .totalCount(total != null ? total : 0)
                .distribution(dist)
                .reviews(reviewPage.getContent().stream().map(this::toResponse).toList())
                .totalPages(reviewPage.getTotalPages())
                .currentPage(page)
                .build();
    }

    @Override
    @Transactional
    public ReviewResponse createReview(String email, Long productId,
                                       CreateReviewRequest req, List<MultipartFile> images) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));

        if (reviewRepository.existsByProductIdAndUserId(productId, user.getId())) {
            throw new BusinessException("Bạn đã đánh giá sản phẩm này rồi");
        }

        // Kiểm tra verified purchase
        Order verifiedOrder = orderRepository
                .findDeliveredOrderContainingProduct(user.getId(), productId)
                .orElse(null);

        Review review = Review.builder()
                .product(product)
                .user(user)
                .order(verifiedOrder)
                .rating(req.getRating().byteValue())
                .title(req.getTitle())
                .comment(req.getComment())
                .verified(verifiedOrder != null)
                .build();

        Review saved = reviewRepository.save(review);

        if (images != null && !images.isEmpty()) {
            for (int i = 0; i < images.size(); i++) {
                String url = cloudinaryService.uploadImage(images.get(i));
                reviewImageRepository.save(ReviewImage.builder()
                        .review(saved).url(url).sortOrder(i).build());
            }
        }

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteReview(String email, Long reviewId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá"));

        if (!review.getUser().getId().equals(user.getId())) {
            throw new BusinessException("Bạn không có quyền xoá đánh giá này");
        }

        review.getImages().forEach(img -> cloudinaryService.deleteImage(img.getUrl()));
        reviewRepository.delete(review);
    }

    private ReviewResponse toResponse(Review r) {
        return ReviewResponse.builder()
                .id(r.getId())
                .userId(r.getUser().getId())
                .userName(r.getUser().getFullName())
                .rating(r.getRating())
                .title(r.getTitle())
                .comment(r.getComment())
                .verified(r.getVerified())
                .images(r.getImages().stream().map(ReviewImage::getUrl).toList())
                .createdAt(r.getCreatedAt())
                .build();
    }
}