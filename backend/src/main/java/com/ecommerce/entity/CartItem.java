package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "cart_items",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_cart_user_product_variant",
        columnNames = {"user_id", "product_id", "variant_id"}
    ))
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // LAZY — được load bằng JOIN FETCH trong query
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // LAZY — được load bằng JOIN FETCH trong query
    // null = sản phẩm không có variant
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private ProductVariant variant;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Transient
    public java.math.BigDecimal getEffectivePrice() {
        if (variant != null) return variant.getEffectivePrice();
        return product.getEffectivePrice();
    }

    @Transient
    public int getAvailableStock() {
        if (variant != null) return variant.getStockQty();
        return product.getStockQty();
    }
}