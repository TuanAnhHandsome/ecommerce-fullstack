-- ============================================================
-- E-COMMERCE DATABASE SCHEMA
-- Stack: MySQL 8.0+ | Spring Boot + JPA
-- Author: ecommerce-clone project
-- ============================================================

CREATE DATABASE IF NOT EXISTS ecommerce_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ecommerce_db;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
  id           BIGINT        NOT NULL AUTO_INCREMENT,
  full_name    VARCHAR(100)  NOT NULL,
  email        VARCHAR(150)  NOT NULL UNIQUE,
  password     VARCHAR(255)  NOT NULL,               -- BCrypt hashed
  phone        VARCHAR(20),
  address      TEXT,
  role         ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
  enabled      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_users_email (email),
  INDEX idx_users_role  (role)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: categories
-- ============================================================
CREATE TABLE categories (
  id          BIGINT        NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100)  NOT NULL UNIQUE,
  slug        VARCHAR(100)  NOT NULL UNIQUE,
  description TEXT,
  image_url   VARCHAR(500),
  active      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_categories_slug (slug)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: products
-- ============================================================
CREATE TABLE products (
  id           BIGINT         NOT NULL AUTO_INCREMENT,
  category_id  BIGINT,
  name         VARCHAR(255)   NOT NULL,
  slug         VARCHAR(255)   NOT NULL UNIQUE,
  description  TEXT,
  price        DECIMAL(15,0)  NOT NULL,              -- VND (no decimals)
  sale_price   DECIMAL(15,0),                        -- NULL = no sale
  stock_qty    INT            NOT NULL DEFAULT 0,
  image_url    VARCHAR(500),
  sku          VARCHAR(100)   UNIQUE,
  active       BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY  (id),
  FOREIGN KEY  (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_products_category (category_id),
  INDEX idx_products_active   (active),
  INDEX idx_products_slug     (slug),
  FULLTEXT idx_products_search (name, description)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: cart_items
-- ============================================================
CREATE TABLE cart_items (
  id          BIGINT   NOT NULL AUTO_INCREMENT,
  user_id     BIGINT   NOT NULL,
  product_id  BIGINT   NOT NULL,
  quantity    INT      NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY  uq_cart_user_product (user_id, product_id),  -- 1 row per product per user
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_cart_user (user_id)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: orders
-- ============================================================
CREATE TABLE orders (
  id               BIGINT         NOT NULL AUTO_INCREMENT,
  user_id          BIGINT         NOT NULL,
  order_code       VARCHAR(50)    NOT NULL UNIQUE,   -- ORD-20240101-XXXX
  total_amount     DECIMAL(15,0)  NOT NULL,
  shipping_fee     DECIMAL(15,0)  NOT NULL DEFAULT 0,
  discount_amount  DECIMAL(15,0)  NOT NULL DEFAULT 0,
  final_amount     DECIMAL(15,0)  NOT NULL,          -- total + shipping - discount
  status           ENUM(
    'PENDING',        -- vừa tạo, chờ thanh toán
    'AWAITING_PAYMENT',
    'PAID',           -- đã thanh toán xong
    'PROCESSING',     -- đang xử lý / đóng gói
    'SHIPPED',        -- đã giao cho vận chuyển
    'DELIVERED',      -- giao thành công
    'CANCELLED',      -- huỷ
    'REFUNDED'        -- hoàn tiền
  ) NOT NULL DEFAULT 'PENDING',
  shipping_name    VARCHAR(100)   NOT NULL,
  shipping_phone   VARCHAR(20)    NOT NULL,
  shipping_address TEXT           NOT NULL,
  note             TEXT,
  created_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_orders_user       (user_id),
  INDEX idx_orders_status     (status),
  INDEX idx_orders_order_code (order_code),
  INDEX idx_orders_created_at (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: order_items
-- ============================================================
CREATE TABLE order_items (
  id          BIGINT        NOT NULL AUTO_INCREMENT,
  order_id    BIGINT        NOT NULL,
  product_id  BIGINT,                                -- NULL nếu product bị xoá
  product_name VARCHAR(255) NOT NULL,                -- snapshot lúc đặt hàng
  product_img  VARCHAR(500),
  unit_price  DECIMAL(15,0) NOT NULL,               -- giá lúc đặt (snapshot)
  quantity    INT           NOT NULL CHECK (quantity > 0),
  subtotal    DECIMAL(15,0) NOT NULL,               -- unit_price * quantity
  PRIMARY KEY (id),
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_order_items_order   (order_id),
  INDEX idx_order_items_product (product_id)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: payments
-- ============================================================
CREATE TABLE payments (
  id               BIGINT         NOT NULL AUTO_INCREMENT,
  order_id         BIGINT         NOT NULL UNIQUE,   -- 1 order = 1 payment record
  gateway          ENUM('VNPAY','STRIPE','COD') NOT NULL,
  amount           DECIMAL(15,0)  NOT NULL,
  currency         VARCHAR(3)     NOT NULL DEFAULT 'VND',
  status           ENUM(
    'PENDING',
    'SUCCESS',
    'FAILED',
    'CANCELLED',
    'REFUNDED'
  ) NOT NULL DEFAULT 'PENDING',

  -- VNPay specific
  vnp_txn_ref      VARCHAR(100),                     -- mã giao dịch FE tạo
  vnp_transaction_no VARCHAR(100),                   -- mã GD phía VNPay
  vnp_bank_code    VARCHAR(20),
  vnp_pay_date     VARCHAR(20),
  vnp_response_code VARCHAR(10),
  vnp_secure_hash  VARCHAR(500),                     -- lưu hash để audit

  -- Raw callback từ VNPay (toàn bộ query params dạng JSON)
  raw_callback     JSON,

  paid_at          DATETIME,
  created_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
  INDEX idx_payments_order        (order_id),
  INDEX idx_payments_status       (status),
  INDEX idx_payments_vnp_txn_ref  (vnp_txn_ref)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: refresh_tokens  (JWT Refresh Token rotation)
-- ============================================================
CREATE TABLE refresh_tokens (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  user_id     BIGINT       NOT NULL,
  token       VARCHAR(500) NOT NULL UNIQUE,
  expires_at  DATETIME     NOT NULL,
  revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_refresh_tokens_user  (user_id),
  INDEX idx_refresh_tokens_token (token(100))
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Admin account (password: Admin@123)
INSERT INTO users (full_name, email, password, role) VALUES
('Super Admin', 'admin@ecommerce.vn',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2CL.XFnfAC', -- BCrypt: Admin@123
 'ADMIN');

-- Test user (password: User@123)
INSERT INTO users (full_name, email, password, phone, address, role) VALUES
('Nguyễn Văn A', 'user@ecommerce.vn',
 '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- BCrypt: User@123
 '0912345678', '123 Lê Lợi, Q1, TP.HCM', 'USER');

-- Categories
INSERT INTO categories (name, slug, description) VALUES
('Điện thoại',    'dien-thoai',    'Điện thoại thông minh các loại'),
('Laptop',        'laptop',        'Máy tính xách tay'),
('Tai nghe',      'tai-nghe',      'Tai nghe có dây và không dây'),
('Phụ kiện',      'phu-kien',      'Ốp lưng, sạc, cáp và phụ kiện');

-- Sample products
INSERT INTO products (category_id, name, slug, description, price, sale_price, stock_qty, sku) VALUES
(1, 'iPhone 15 Pro Max 256GB',   'iphone-15-pro-max-256gb',
  'Chip A17 Pro, camera 48MP, Dynamic Island', 34990000, 32990000, 50, 'IP15PM-256'),
(1, 'Samsung Galaxy S24 Ultra',  'samsung-galaxy-s24-ultra',
  'S Pen, camera 200MP, AI tích hợp',           32990000, NULL,     30, 'SS-S24U'),
(2, 'MacBook Air M3 13"',        'macbook-air-m3-13',
  'Chip Apple M3, 8GB RAM, 256GB SSD',           32990000, 30990000, 20, 'MBA-M3-13'),
(2, 'Dell XPS 15 2024',          'dell-xps-15-2024',
  'Intel Core Ultra 7, RTX 4060, 2.8K OLED',   42990000, NULL,     15, 'DELL-XPS15'),
(3, 'Sony WH-1000XM5',           'sony-wh-1000xm5',
  'Chống ồn hàng đầu, 30h pin',                  8990000, 7490000,  100,'SONY-XM5'),
(4, 'Sạc nhanh 67W Xiaomi',      'sac-nhanh-67w-xiaomi',
  'GaN, 3 cổng USB-A+C, nhỏ gọn',                  490000, NULL,     200,'XIAOMI-67W');
