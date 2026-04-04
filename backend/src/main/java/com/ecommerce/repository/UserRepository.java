// ===== UserRepository.java =====
package com.ecommerce.repository;

import com.ecommerce.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE :keyword IS NULL " +
           "OR LOWER(u.fullName) LIKE LOWER(CONCAT('%',:keyword,'%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%',:keyword,'%'))")
    Page<User> searchUsers(String keyword, Pageable pageable);
}
