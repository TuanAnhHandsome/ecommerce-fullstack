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

    @Column(name = "request_code", nullable = false, unique = true, length = 50)
    private String requestCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Enumerated(EnumType.STRING)
    // Force VARCHAR để khớp schema hiện tại trong DB
    @Column(nullable = false, length = 20, columnDefinition = "VARCHAR(20)")
    private WarrantyType type;

    @Enumerated(EnumType.STRING)
    // Force VARCHAR để khớp schema hiện tại trong DB
    @Column(nullable = false, length = 20, columnDefinition = "VARCHAR(20)")
    @Builder.Default
    private WarrantyStatus status = WarrantyStatus.PENDING;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    @Column(name = "estimated_return_date")
    private LocalDateTime estimatedReturnDate;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
