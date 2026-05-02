package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    // Giữ reference để có thể link về trang sản phẩm
    // nullable vì sản phẩm có thể bị xóa sau này
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id")
    private Product product;

    // ── Snapshot tại thời điểm đặt hàng ─────────────────────────
    // Lưu thông tin tại thời điểm mua để tránh mất dữ liệu
    // khi product/variant bị sửa hoặc xóa sau này

    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    @Column(name = "product_img", length = 500)
    private String productImg;

    /** null nếu sản phẩm không có variant */
    @Column(name = "variant_id")
    private Long variantId;

    /** Tên variant snapshot, ví dụ: "Màu: Đỏ / Size: XL" */
    @Column(name = "variant_name", length = 255)
    private String variantName;

    @Column(name = "sku", length = 100)
    private String sku;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 0)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 15, scale = 0)
    private BigDecimal subtotal;
}