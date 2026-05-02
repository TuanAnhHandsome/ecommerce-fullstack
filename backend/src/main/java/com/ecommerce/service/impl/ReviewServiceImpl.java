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

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository      reviewRepository;
    private final ReviewImageRepository reviewImageRepository;
    private final ProductRepository     productRepository;
    private final UserRepository        userRepository;
    private final OrderRepository       orderRepository;
    private final CloudinaryService     cloudinaryService;

    // ─────────────────────────────────────────────────────────────
    // GET REVIEWS (public)
    // ─────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public ReviewSummaryResponse getReviews(Long productId, int page, int size, String sortBy) {
        PageRequest pageable = PageRequest.of(
                page, size,
                Sort.Direction.DESC,
                sortBy.equals("rating") ? "rating" : "createdAt"
        );

        Page<Review> reviewPage = reviewRepository.findByProductId(productId, pageable);

        Double  avg   = reviewRepository.avgRatingByProduct(productId);
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

    // ─────────────────────────────────────────────────────────────
    // CREATE REVIEW
    // ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public ReviewResponse createReview(String email, Long productId,
                                       CreateReviewRequest req,
                                       List<MultipartFile> images) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));

        // 1. Xác minh order DELIVERED và thuộc về user
        Order order = orderRepository
                .findDeliveredOrderByIdAndUser(req.getOrderId(), user.getId())
                .orElseThrow(() -> new BusinessException(
                        "Chỉ có thể đánh giá sản phẩm sau khi đơn hàng được giao thành công"));

        // 2. Xác minh product thực sự có trong order này
        boolean productInOrder = order.getOrderItems().stream()
                .anyMatch(item -> item.getProduct() != null
                        && item.getProduct().getId().equals(productId));
        if (!productInOrder) {
            throw new BusinessException("Sản phẩm không có trong đơn hàng này");
        }

        // 3. Kiểm tra đã review product trong order này chưa
        //    (cho phép review cùng product từ các đơn khác nhau)
        if (reviewRepository.existsByProductIdAndUserIdAndOrderId(
                productId, user.getId(), order.getId())) {
            throw new BusinessException("Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi");
        }

        // 4. Tạo review — verified = true vì đã xác minh DELIVERED
        Review review = Review.builder()
                .product(product)
                .user(user)
                .order(order)
                .rating(req.getRating().byteValue())
                .title(req.getTitle())
                .comment(req.getComment())
                .verified(true)
                .build();

        Review saved = reviewRepository.save(review);

        // 5. Upload ảnh nếu có (tối đa 5 ảnh)
        if (images != null && !images.isEmpty()) {
            int limit = Math.min(images.size(), 5);
            for (int i = 0; i < limit; i++) {
                String url = cloudinaryService.uploadImage(images.get(i));
                reviewImageRepository.save(
                        ReviewImage.builder()
                                .review(saved)
                                .url(url)
                                .sortOrder(i)
                                .build()
                );
            }
        }

        return toResponse(saved);
    }

    // ─────────────────────────────────────────────────────────────
    // DELETE REVIEW
    // ─────────────────────────────────────────────────────────────

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

        // Xoá ảnh trên Cloudinary trước
        review.getImages().forEach(img -> cloudinaryService.deleteImage(img.getUrl()));
        reviewRepository.delete(review);
    }

    // ─────────────────────────────────────────────────────────────
    // GET REVIEWED PRODUCT IDS (dùng ở OrderDetailPage)
    // ─────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Set<Long> getReviewedProductIds(String email, Long orderId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));

        return new HashSet<>(
                reviewRepository.findReviewedProductIdsByOrderAndUser(orderId, user.getId())
        );
    }

    // ─────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────

    private ReviewResponse toResponse(Review r) {
        return ReviewResponse.builder()
                .id(r.getId())
                .userId(r.getUser().getId())
                .userName(r.getUser().getFullName())
                .productId(r.getProduct() != null ? r.getProduct().getId() : null)
                .orderId(r.getOrder()   != null ? r.getOrder().getId()   : null)
                .rating(r.getRating())
                .title(r.getTitle())
                .comment(r.getComment())
                .verified(r.getVerified())
                .images(r.getImages().stream().map(ReviewImage::getUrl).toList())
                .createdAt(r.getCreatedAt())
                .build();
    }
}