package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_specs",
       indexes = @Index(name = "idx_spec_product", columnList = "product_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductSpec {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /** Nhóm thông số — VD: "Cấu hình", "Màn hình", "Pin & Sạc" */
    @Column(name = "spec_group", nullable = false, length = 100)
    private String specGroup;

    /** Tên thông số — VD: "CPU", "RAM", "Dung lượng pin" */
    @Column(name = "spec_key", nullable = false, length = 100)
    private String specKey;

    /** Giá trị — VD: "Apple A17 Pro", "8 GB", "4000 mAh" */
    @Column(name = "spec_value", nullable = false, length = 500)
    private String specValue;

    /** Thứ tự hiển thị trong nhóm */
    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;
}
