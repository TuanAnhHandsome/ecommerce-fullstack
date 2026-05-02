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

    // EAGER vì VariantValue luôn cần tên option (dùng để build variantValuesMap)
    // Không có N+1 risk vì VariantValue chỉ được load cùng variant
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "variant_option_id", nullable = false)
    private VariantOption variantOption;

    @Column(nullable = false, length = 100)
    private String value;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;
}