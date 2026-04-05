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

    boolean existsByProductIdAndUserId(Long productId, Long userId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId")
    Double avgRatingByProduct(@Param("productId") Long productId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.id = :productId")
    Integer countByProduct(@Param("productId") Long productId);

    @Query("""
        SELECT r.rating, COUNT(r) FROM Review r
        WHERE r.product.id = :productId
        GROUP BY r.rating
        ORDER BY r.rating DESC
    """)
    List<Object[]> countByRatingForProduct(@Param("productId") Long productId);
}