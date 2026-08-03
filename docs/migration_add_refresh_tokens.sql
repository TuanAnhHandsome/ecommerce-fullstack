-- Migration: thêm bảng refresh_tokens
-- Cần chạy tay vì application.yml đang dùng `ddl-auto: validate` (Hibernate không tự tạo bảng).
-- Chạy trước khi deploy code AuthController/AuthServiceImpl mới (nếu không app sẽ
-- báo lỗi "Schema-validation: missing table [refresh_tokens]" lúc khởi động).

CREATE TABLE refresh_tokens (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    token      VARCHAR(512) NOT NULL,
    user_id    BIGINT NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NULL,

    CONSTRAINT uq_refresh_tokens_token UNIQUE (token),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
