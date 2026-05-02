package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Từng sản phẩm trong yêu cầu hoàn hàng.
 * Snapshot thông tin tại thời điểm tạo yêu cầu.
 */
@Entity
@Table(name = "return_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReturnItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "return_request_id", nullable = false)
    private ReturnRequest returnRequest;

    /** FK sang OrderItem để trace về đơn gốc */
    @Column(name = "order_item_id", nullable = false)
    private Long orderItemId;

    // ── Snapshot tại thời điểm hoàn ──────────────────────────────
    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    @Column(name = "product_img", length = 500)
    private String productImg;

    @Column(name = "variant_name", length = 255)
    private String variantName;

    @Column(name = "sku", length = 100)
    private String sku;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 0)
    private BigDecimal unitPrice;

    /** Số lượng muốn hoàn (≤ quantity đặt ban đầu) */
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "subtotal", nullable = false, precision = 15, scale = 0)
    private BigDecimal subtotal;
}
