package com.ecommerce.repository;

import com.ecommerce.entity.WarrantyRequest;
import com.ecommerce.enums.WarrantyStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface WarrantyRepository extends JpaRepository<WarrantyRequest, Long> {

    Optional<WarrantyRequest> findByRequestCode(String requestCode);

    /** Tất cả yêu cầu của 1 user */
    Page<WarrantyRequest> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /** Admin: lọc theo status (null = tất cả) */
    @Query("""
        SELECT w FROM WarrantyRequest w
        LEFT JOIN FETCH w.user
        LEFT JOIN FETCH w.order
        WHERE (:status IS NULL OR w.status = :status)
          AND (
            :keyword IS NULL OR :keyword = ''
            OR LOWER(w.requestCode)  LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(w.productName)  LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(w.serialNumber) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(w.user.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(w.user.phone)   LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
        ORDER BY w.createdAt DESC
        """)
    Page<WarrantyRequest> searchAdmin(
        @Param("status")  WarrantyStatus status,
        @Param("keyword") String keyword,
        Pageable pageable);

    Long countByStatus(WarrantyStatus status);
}
