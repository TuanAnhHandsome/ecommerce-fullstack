package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Lưu refresh token đã phát hành cho từng user.
 *
 * Trước đây refresh token là JWT thuần "stateless" — không có bản ghi nào ở DB,
 * nên KHÔNG thể vô hiệu hoá 1 token đang tồn tại (không có logout thật, không thể
 * revoke khi nghi ngờ token bị đánh cắp; token cứ hoạt động tới khi tự hết hạn).
 *
 * Giờ mỗi refresh token phát hành đều có 1 dòng ở đây. Khi logout hoặc khi
 * refresh (rotation), dòng tương ứng bị xoá — nghĩa là token đó chết ngay,
 * không cần chờ hết hạn.
 */
@Entity
@Table(name = "refresh_tokens", indexes = {
        @Index(name = "idx_refresh_token_token", columnList = "token", unique = true),
        @Index(name = "idx_refresh_token_user", columnList = "user_id")
})
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 512)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    @Builder.Default
    private boolean revoked = false;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
