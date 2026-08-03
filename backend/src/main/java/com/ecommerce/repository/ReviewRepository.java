package com.ecommerce.repository;

import com.ecommerce.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByProductId(Long productId, Pageable pageable);

    // ── Dùng trong getReviews() ──────────────────────────────────────

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId")
    Double avgRatingByProduct(@Param("productId") Long productId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.id = :productId")
    Integer countByProduct(@Param("productId") Long productId);

    /**
     * Batch version — trả về [productId, avgRating, reviewCount] cho danh sách sản phẩm,
     * dùng trong getProducts/getProductsAdmin để tránh 2 query/sản phẩm (fix N+1).
     */
    @Query("""
        SELECT r.product.id, AVG(r.rating), COUNT(r)
        FROM Review r
        WHERE r.product.id IN :productIds
        GROUP BY r.product.id
        """)
    List<Object[]> aggregateByProductIds(@Param("productIds") List<Long> productIds);

    @Query("""
            SELECT r.rating, COUNT(r) FROM Review r
            WHERE r.product.id = :productId
            GROUP BY r.rating
            """)
    List<Object[]> countByRatingForProduct(@Param("productId") Long productId);

    // ── Dùng trong createReview() ────────────────────────────────────

    /**
     * Kiểm tra user đã từng review product này chưa (bất kỳ order nào).
     * Giữ lại để dùng trường hợp review không gắn order.
     */
    boolean existsByProductIdAndUserId(Long productId, Long userId);

    /**
     * [MỚI] Kiểm tra user đã review product trong context của order cụ thể chưa.
     * Cho phép cùng 1 user review cùng 1 product từ các đơn hàng khác nhau.
     */
    boolean existsByProductIdAndUserIdAndOrderId(
            Long productId, Long userId, Long orderId);

    // ── Dùng trong getReviewedProductIds() ──────────────────────────

    /**
     * [MỚI] Lấy danh sách productId đã được review trong 1 order.
     * FE dùng để disable nút "Đánh giá" cho item đã review.
     */
    @Query("""
            SELECT r.product.id FROM Review r
            WHERE r.order.id = :orderId
              AND r.user.id  = :userId
            """)
    List<Long> findReviewedProductIdsByOrderAndUser(
            @Param("orderId") Long orderId,
            @Param("userId")  Long userId);
}