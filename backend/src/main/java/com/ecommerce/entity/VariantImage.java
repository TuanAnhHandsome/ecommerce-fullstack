package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "variant_images")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VariantImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Column(name = "image_url", nullable = false, length = 512)
    private String imageUrl;

    @Column(name = "public_id", length = 256)
    private String publicId;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    /**
     * Alias để tương thích với code cũ dùng .getUrl() / .setUrl().
     * Lombok @Getter tạo getImageUrl() từ field imageUrl,
     * nên cần thêm method này thủ công.
     */
    public String getUrl() {
        return imageUrl;
    }

    public void setUrl(String url) {
        this.imageUrl = url;
    }
}