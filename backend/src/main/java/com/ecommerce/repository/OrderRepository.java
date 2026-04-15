package com.ecommerce.repository;

import com.ecommerce.entity.Order;
import com.ecommerce.entity.User;
import com.ecommerce.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByUser(User user, Pageable pageable);
    Optional<Order> findByOrderCode(String orderCode);
    Optional<Order> findByIdAndUser(Long id, User user);
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
    Long countByStatus(OrderStatus status);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.user ORDER BY o.createdAt DESC")
    Page<Order> findAllWithUser(Pageable pageable);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.user WHERE o.status = :status ORDER BY o.createdAt DESC")
    Page<Order> findAllWithUserByStatus(@Param("status") OrderStatus status, Pageable pageable);

    @Query("SELECT SUM(o.finalAmount) FROM Order o WHERE o.status = 'PAID'")
    BigDecimal getTotalRevenue();

    @Query("SELECT SUM(o.finalAmount) FROM Order o WHERE o.status = 'PAID' " +
           "AND o.createdAt >= :start AND o.createdAt <= :end")
    BigDecimal getRevenueByDateRange(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :start AND o.createdAt <= :end")
    Long countOrdersByDateRange(LocalDateTime start, LocalDateTime end);

    @Query(value = "SELECT DATE(created_at) as date, SUM(final_amount) as revenue, COUNT(*) as orders " +
           "FROM orders WHERE status = 'PAID' AND created_at >= :since " +
           "GROUP BY DATE(created_at) ORDER BY date ASC", nativeQuery = true)
    List<Object[]> getRevenueGroupByDay(LocalDateTime since);

    @Query("""
        SELECT o FROM Order o
        JOIN o.orderItems oi
        WHERE o.user.id = :userId
          AND oi.product.id = :productId
          AND o.status = 'DELIVERED'
        ORDER BY o.createdAt DESC
        LIMIT 1
    """)
    Optional<Order> findDeliveredOrderContainingProduct(
        @Param("userId") Long userId,
        @Param("productId") Long productId);

    // ── MỚI: Top sản phẩm bán chạy — dùng Pageable để tránh lỗi LIMIT với named param ──
    @Query(value = """
        SELECT oi.product_id,
               p.name,
               p.image_url,
               SUM(oi.quantity)  AS total_sold,
               SUM(oi.subtotal)  AS total_revenue
        FROM   order_items oi
        JOIN   orders      o ON o.id  = oi.order_id
        JOIN   products    p ON p.id  = oi.product_id
        WHERE  o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED')
        GROUP  BY oi.product_id, p.name, p.image_url
        ORDER  BY total_sold DESC
        """,
        countQuery = "SELECT COUNT(DISTINCT oi.product_id) FROM order_items oi",
        nativeQuery = true)
    Page<Object[]> getTopSellingProducts(Pageable pageable);
}