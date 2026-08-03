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
     * Batch version — dùng trong danh sách sản phẩm (getProducts/getProductsAdmin)
     * để tránh gọi findByProductIdWithValues() N lần (1 lần / sản phẩm).
     */
    @Query("""
        SELECT DISTINCT v FROM ProductVariant v
        LEFT JOIN FETCH v.variantValues
        WHERE v.product.id IN :productIds
        ORDER BY v.product.id, v.sortOrder ASC
    """)
    List<ProductVariant> findByProductIdInWithValues(@Param("productIds") List<Long> productIds);

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

    /** Batch version tương ứng — fix N+1. */
    @Query("""
        SELECT DISTINCT v FROM ProductVariant v
        LEFT JOIN FETCH v.images
        WHERE v.product.id IN :productIds
        ORDER BY v.product.id, v.sortOrder ASC
    """)
    List<ProductVariant> findByProductIdInWithImages(@Param("productIds") List<Long> productIds);

    /**
     * Query đơn giản không fetch collection — dùng trong VariantService.getVariants()
     * khi chỉ cần list cơ bản.
     */
    List<ProductVariant> findByProductIdOrderBySortOrder(Long productId);

    void deleteByProductId(Long productId);
}