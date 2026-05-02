package com.ecommerce.repository;

import com.ecommerce.entity.CartItem;
import com.ecommerce.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    // Query đơn giản nhất — không JOIN FETCH, không DISTINCT
    // CartServiceImpl sẽ access các field trong @Transactional session
    List<CartItem> findByUserOrderByCreatedAtDesc(User user);

    @Query("""
        SELECT c FROM CartItem c
        WHERE c.user.id = :userId
          AND c.product.id = :productId
          AND ((:variantId IS NULL AND c.variant IS NULL)
               OR c.variant.id = :variantId)
        """)
    Optional<CartItem> findByUserIdAndProductIdAndVariantId(
            @Param("userId") Long userId,
            @Param("productId") Long productId,
            @Param("variantId") Long variantId
    );

    @Modifying
    @Query("DELETE FROM CartItem c WHERE c.user.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}