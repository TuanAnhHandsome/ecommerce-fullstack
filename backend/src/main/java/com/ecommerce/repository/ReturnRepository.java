package com.ecommerce.repository;

import com.ecommerce.entity.ReturnRequest;
import com.ecommerce.enums.ReturnStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ReturnRepository extends JpaRepository<ReturnRequest, Long> {

    /** Khách xem yêu cầu của mình */
    Page<ReturnRequest> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /** Kiểm tra đã tạo return cho order này chưa */
    boolean existsByOrderIdAndUserId(Long orderId, Long userId);

    /** Tìm theo returnCode — tra cứu */
    Optional<ReturnRequest> findByReturnCode(String returnCode);

    /** Admin search: filter status + keyword */
    @Query("""
            SELECT r FROM ReturnRequest r
            WHERE (:status  IS NULL OR r.status = :status)
              AND (:keyword IS NULL OR :keyword = ''
                   OR LOWER(r.returnCode)       LIKE LOWER(CONCAT('%',:keyword,'%'))
                   OR LOWER(r.order.orderCode)  LIKE LOWER(CONCAT('%',:keyword,'%'))
                   OR LOWER(r.user.email)       LIKE LOWER(CONCAT('%',:keyword,'%'))
                   OR LOWER(r.user.fullName)    LIKE LOWER(CONCAT('%',:keyword,'%')))
            ORDER BY r.createdAt DESC
            """)
    Page<ReturnRequest> searchAdmin(
            @Param("status")  ReturnStatus status,
            @Param("keyword") String keyword,
            Pageable pageable);

    /** Đếm theo status — dùng cho dashboard admin */
    long countByStatus(ReturnStatus status);
}
