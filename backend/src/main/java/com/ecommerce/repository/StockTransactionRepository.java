package com.ecommerce.repository;

import com.ecommerce.entity.StockTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {

    Page<StockTransaction> findByProductIdOrderByCreatedAtDesc(Long productId, Pageable pageable);

    @Query("""
        SELECT t FROM StockTransaction t
        LEFT JOIN FETCH t.product p
        WHERE (:keyword IS NULL OR :keyword = ''
               OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(p.sku)  LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(t.supplier) LIKE LOWER(CONCAT('%', :keyword, '%')))
        ORDER BY t.createdAt DESC
        """)
    Page<StockTransaction> searchAll(@Param("keyword") String keyword, Pageable pageable);
}
