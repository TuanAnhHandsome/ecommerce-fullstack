package com.ecommerce.entity;

import com.ecommerce.enums.StockTransactionType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_transactions",
       indexes = {
           @Index(name = "idx_stock_product", columnList = "product_id"),
           @Index(name = "idx_stock_type",    columnList = "type"),
       })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StockTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /** IMPORT (nhập), EXPORT (xuất), ADJUST (điều chỉnh) */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private StockTransactionType type;

    /** Số lượng thay đổi (luôn dương — chiều được xác định bởi type) */
    @Column(nullable = false)
    private Integer quantity;

    /** Tồn kho sau giao dịch */
    @Column(name = "stock_after", nullable = false)
    private Integer stockAfter;

    /** Giá nhập (chỉ có với IMPORT) */
    @Column(name = "unit_cost", precision = 15, scale = 0)
    private BigDecimal unitCost;

    /** Nhà cung cấp */
    @Column(name = "supplier", length = 255)
    private String supplier;

    /** Ghi chú */
    @Column(length = 500)
    private String note;

    /** Admin thực hiện */
    @Column(name = "created_by", length = 100)
    private String createdBy;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
