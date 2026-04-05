package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "variant_options")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VariantOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @OneToMany(mappedBy = "variantOption", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<VariantValue> values = new ArrayList<>();
}