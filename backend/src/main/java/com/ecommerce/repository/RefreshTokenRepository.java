package com.ecommerce.repository;

import com.ecommerce.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenAndRevokedFalse(String token);

    // Derived delete method — Spring Data tự bọc @Transactional cho method này,
    // không cần thêm @Modifying/@Transactional thủ công.
    void deleteByToken(String token);
}
