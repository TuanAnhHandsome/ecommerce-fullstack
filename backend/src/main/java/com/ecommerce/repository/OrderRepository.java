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

    // ✅ THÊM MỚI: JOIN FETCH user để tránh LazyInitializationException
    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.user ORDER BY o.createdAt DESC")
    Page<Order> findAllWithUser(Pageable pageable);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.user WHERE o.status = :status ORDER BY o.createdAt DESC")
    Page<Order> findAllWithUserByStatus(@Param("status") OrderStatus status, Pageable pageable);

    // Giữ nguyên các query cũ
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
}