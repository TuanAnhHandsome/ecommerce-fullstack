package com.ecommerce.entity;

import com.ecommerce.enums.DiscountType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons",
       indexes = {
           @Index(name = "idx_coupon_code",   columnList = "code",   unique = true),
           @Index(name = "idx_coupon_active",  columnList = "active"),
       })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Mã coupon — VD: SUMMER20, FREESHIP */
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    /** Mô tả ngắn — VD: "Giảm 20% cho đơn từ 500k" */
    @Column(length = 255)
    private String description;

    /** PERCENT hoặc FIXED */
    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 10)
    private DiscountType discountType;

    /** Giá trị giảm — 20 (%) hoặc 50000 (đ) */
    @Column(name = "discount_value", nullable = false, precision = 15, scale = 0)
    private BigDecimal discountValue;

    /** Giảm tối đa (áp dụng khi discountType = PERCENT) */
    @Column(name = "max_discount_amount", precision = 15, scale = 0)
    private BigDecimal maxDiscountAmount;

    /** Đơn hàng tối thiểu để áp dụng */
    @Column(name = "min_order_amount", precision = 15, scale = 0)
    @Builder.Default
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    /** Tổng số lần được dùng (null = không giới hạn) */
    @Column(name = "usage_limit")
    private Integer usageLimit;

    /** Số lần đã dùng */
    @Column(name = "used_count", nullable = false)
    @Builder.Default
    private Integer usedCount = 0;

    /** Mỗi user chỉ được dùng tối đa N lần (null = không giới hạn) */
    @Column(name = "per_user_limit")
    private Integer perUserLimit;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "starts_at")
    private LocalDateTime startsAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
