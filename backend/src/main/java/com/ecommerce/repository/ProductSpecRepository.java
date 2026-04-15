package com.ecommerce.repository;

import com.ecommerce.entity.ProductSpec;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductSpecRepository extends JpaRepository<ProductSpec, Long> {

    /** Lấy tất cả spec của 1 sản phẩm, sắp theo nhóm rồi sort_order */
    @Query("""
        SELECT s FROM ProductSpec s
        WHERE s.product.id = :productId
        ORDER BY s.specGroup, s.sortOrder
        """)
    List<ProductSpec> findByProductIdOrdered(@Param("productId") Long productId);

    /** Xóa toàn bộ spec của sản phẩm — dùng khi replace-all khi update */
    @Modifying
    @Query("DELETE FROM ProductSpec s WHERE s.product.id = :productId")
    void deleteByProductId(@Param("productId") Long productId);
}
