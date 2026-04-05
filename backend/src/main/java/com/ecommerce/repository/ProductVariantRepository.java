package com.ecommerce.repository;

import com.ecommerce.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    /**
     * Fetch variants + variantValues (dùng trong toResponse để lấy valueLabels).
     * Tách riêng khỏi images để tránh Hibernate MultipleBagFetchException.
     */
    @Query("""
        SELECT DISTINCT v FROM ProductVariant v
        LEFT JOIN FETCH v.variantValues
        WHERE v.product.id = :productId
        ORDER BY v.sortOrder ASC
    """)
    List<ProductVariant> findByProductIdWithValues(@Param("productId") Long productId);

    /**
     * Fetch variants + images (dùng để build imagesMap).
     * Tách riêng khỏi variantValues để tránh MultipleBagFetchException.
     */
    @Query("""
        SELECT DISTINCT v FROM ProductVariant v
        LEFT JOIN FETCH v.images
        WHERE v.product.id = :productId
        ORDER BY v.sortOrder ASC
    """)
    List<ProductVariant> findByProductIdWithImages(@Param("productId") Long productId);

    /**
     * Query đơn giản không fetch collection — dùng trong VariantService.getVariants()
     * khi chỉ cần list cơ bản.
     */
    List<ProductVariant> findByProductIdOrderBySortOrder(Long productId);

    void deleteByProductId(Long productId);
}