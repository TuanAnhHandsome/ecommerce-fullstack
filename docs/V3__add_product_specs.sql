-- ============================================================
-- Migration: Tạo bảng product_specs
-- Chạy 1 lần — nếu dùng Flyway đặt tên: V3__add_product_specs.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS product_specs (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id  BIGINT       NOT NULL,
    spec_group  VARCHAR(100) NOT NULL COMMENT 'Nhóm thông số — VD: Cấu hình, Màn hình',
    spec_key    VARCHAR(100) NOT NULL COMMENT 'Tên thông số — VD: CPU, RAM',
    spec_value  VARCHAR(500) NOT NULL COMMENT 'Giá trị — VD: Apple A17 Pro',
    sort_order  INT          NOT NULL DEFAULT 0,

    CONSTRAINT fk_spec_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,

    INDEX idx_spec_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
