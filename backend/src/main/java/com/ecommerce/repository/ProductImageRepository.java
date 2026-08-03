package com.ecommerce.repository;

import com.ecommerce.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    List<ProductImage> findByProductIdOrderBySortOrder(Long productId);

    // ── Batch load cho danh sách sản phẩm (fix N+1 trong getProducts/getProductsAdmin) ──
    List<ProductImage> findByProductIdInOrderBySortOrder(List<Long> productIds);

    void deleteByIdIn(List<Long> ids);
}