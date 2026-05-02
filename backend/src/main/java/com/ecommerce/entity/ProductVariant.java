package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_variants")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(unique = true, length = 100)
    private String sku;

    @Column(nullable = false, precision = 15, scale = 0)
    private BigDecimal price;

    @Column(name = "sale_price", precision = 15, scale = 0)
    private BigDecimal salePrice;

    @Column(name = "stock_qty", nullable = false)
    @Builder.Default
    private Integer stockQty = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    /**
     * EAGER — variantValues luôn cần thiết để:
     * 1. Hiển thị tên variant trong CartResponse (buildCartResponse)
     * 2. Build variantName trong OrderItem (buildVariantName)
     * Số lượng values mỗi variant rất nhỏ (2-5 items) nên EAGER an toàn.
     */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "product_variant_values",
        joinColumns = @JoinColumn(name = "variant_id"),
        inverseJoinColumns = @JoinColumn(name = "variant_value_id")
    )
    @Builder.Default
    private List<VariantValue> variantValues = new ArrayList<>();

    @OneToMany(mappedBy = "variant", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<VariantImage> images = new ArrayList<>();

    @Transient
    public BigDecimal getEffectivePrice() {
        return salePrice != null ? salePrice : price;
    }
}