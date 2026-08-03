package com.ecommerce.repository;

import com.ecommerce.entity.VariantOption;
import jakarta.persistence.EntityGraph;  // ← thêm
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;       // ← thêm
import org.springframework.data.repository.query.Param;     // ← thêm
import java.util.List;

public interface VariantOptionRepository extends JpaRepository<VariantOption, Long> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"values"})
    @Query("SELECT o FROM VariantOption o WHERE o.product.id = :productId ORDER BY o.sortOrder")
    List<VariantOption> findByProductIdOrderBySortOrder(@Param("productId") Long productId);

    // ── Batch load cho danh sách sản phẩm (fix N+1) ──
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"values"})
    @Query("SELECT o FROM VariantOption o WHERE o.product.id IN :productIds ORDER BY o.product.id, o.sortOrder")
    List<VariantOption> findByProductIdInOrderBySortOrder(@Param("productIds") List<Long> productIds);

    void deleteByProductId(Long productId);
}