package com.ecommerce.repository;

import com.ecommerce.entity.Product;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository
        extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    Optional<Product> findBySlug(String slug);
    boolean existsBySlug(String slug);
    boolean existsBySkuAndIdNot(String sku, Long id);

    @Query("SELECT p.name FROM Product p WHERE p.active = true ORDER BY p.createdAt DESC")
    List<String> findTopProductNames(Pageable pageable);

    // ── MỚI: Sản phẩm tồn kho thấp (active, stockQty <= threshold) ──
    @Query("""
        SELECT p FROM Product p
        WHERE p.active = true
          AND p.stockQty <= :threshold
        ORDER BY p.stockQty ASC
        """)
    List<Product> findLowStockProducts(@Param("threshold") int threshold, Pageable pageable);
}