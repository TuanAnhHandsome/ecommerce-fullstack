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

    // Dùng trong lookup() — tra cứu công khai
    Optional<WarrantyRequest> findByRequestCode(String requestCode);

    // Dùng trong getMyRequests()
    Page<WarrantyRequest> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // Dùng trong create() — tìm order theo orderCode nhập tay
    // Giữ lại để backward compatible với flow cũ (không biết orderId)
    @Query("SELECT w FROM WarrantyRequest w WHERE w.order.orderCode = :orderCode")
    Optional<WarrantyRequest> findByOrderCode(@Param("orderCode") String orderCode);

    // [MỚI] Kiểm tra user đã tạo warranty cho order này chưa
    boolean existsByOrderIdAndUserId(Long orderId, Long userId);

    // Dùng trong adminList()
    @Query("""
            SELECT w FROM WarrantyRequest w
            WHERE (:status  IS NULL OR w.status = :status)
              AND (:keyword IS NULL OR :keyword = ''
                   OR LOWER(w.requestCode)  LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(w.productName)  LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(w.user.email)   LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(w.user.fullName)LIKE LOWER(CONCAT('%', :keyword, '%')))
            ORDER BY w.createdAt DESC
            """)
    Page<WarrantyRequest> searchAdmin(
            @Param("status")  WarrantyStatus status,
            @Param("keyword") String keyword,
            Pageable pageable);
}