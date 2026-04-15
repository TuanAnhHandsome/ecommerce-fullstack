package com.ecommerce.repository;

import com.ecommerce.entity.Coupon;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    Optional<Coupon> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    @Query("""
        SELECT c FROM Coupon c
        WHERE (:keyword IS NULL OR :keyword = ''
               OR LOWER(c.code)        LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(c.description) LIKE LOWER(CONCAT('%', :keyword, '%')))
        ORDER BY c.createdAt DESC
        """)
    Page<Coupon> search(@Param("keyword") String keyword, Pageable pageable);

    @Query("""
        SELECT COUNT(o) FROM Order o
        WHERE o.couponCode = :code
          AND o.user.id    = :userId
        """)
    long countUsageByUser(@Param("code") String code, @Param("userId") Long userId);
}
