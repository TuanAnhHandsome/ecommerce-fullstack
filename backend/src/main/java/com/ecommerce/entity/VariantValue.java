package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "variant_values")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VariantValue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_option_id", nullable = false)
    private VariantOption variantOption;

    @Column(nullable = false, length = 100)
    private String value;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;
}