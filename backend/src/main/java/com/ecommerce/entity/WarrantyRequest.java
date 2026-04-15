package com.ecommerce.entity;

import com.ecommerce.enums.WarrantyStatus;
import com.ecommerce.enums.WarrantyType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "warranty_requests",
       indexes = {
           @Index(name = "idx_warranty_order",   columnList = "order_id"),
           @Index(name = "idx_warranty_user",    columnList = "user_id"),
           @Index(name = "idx_warranty_status",  columnList = "status"),
       })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WarrantyRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Mã yêu cầu — VD: WR-20240115-0042 */
    @Column(name = "request_code", nullable = false, unique = true, length = 50)
    private String requestCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Đơn hàng liên quan (nullable — khách có thể không nhớ mã đơn) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    /** Tên sản phẩm cần bảo hành (nhập tay — linh hoạt hơn FK product) */
    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    /** Serial number / IMEI nếu có */
    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    /** Loại yêu cầu */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WarrantyType type;

    /** Trạng thái xử lý */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private WarrantyStatus status = WarrantyStatus.PENDING;

    /** Mô tả lỗi / lý do từ khách */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    /** Ghi chú nội bộ từ admin */
    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    /** Ngày dự kiến trả máy */
    @Column(name = "estimated_return_date")
    private LocalDateTime estimatedReturnDate;

    /** Ngày thực tế hoàn thành */
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
