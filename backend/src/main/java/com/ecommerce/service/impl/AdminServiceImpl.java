package com.ecommerce.service.impl;

import com.ecommerce.dto.response.DashboardStatsResponse;
import com.ecommerce.dto.response.DashboardStatsResponse.LowStockItem;
import com.ecommerce.dto.response.DashboardStatsResponse.TopProduct;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.UserResponse;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.User;
import com.ecommerce.enums.OrderStatus;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository    userRepository;
    private final OrderRepository   orderRepository;
    private final ProductRepository productRepository;

    // Ngưỡng cảnh báo tồn kho thấp
    private static final int LOW_STOCK_THRESHOLD = 10;

    @Override
    public DashboardStatsResponse getDashboardStats() {
        LocalDateTime todayStart = LocalDateTime.now().with(LocalTime.MIN);
        LocalDateTime todayEnd   = LocalDateTime.now().with(LocalTime.MAX);

        // ── Các chỉ số cơ bản (giữ nguyên) ──────────────────────────────
        BigDecimal totalRevenue = orderRepository.getTotalRevenue();
        BigDecimal todayRevenue = orderRepository.getRevenueByDateRange(todayStart, todayEnd);

        LocalDateTime since = LocalDateTime.now().minusDays(30);
        List<Object[]> rows = orderRepository.getRevenueGroupByDay(since);
        List<DashboardStatsResponse.RevenueByDay> revenueByDay = rows.stream()
            .map(row -> DashboardStatsResponse.RevenueByDay.builder()
                .date(row[0].toString())
                .revenue(new BigDecimal(row[1].toString()))
                .orders(Long.parseLong(row[2].toString()))
                .build())
            .collect(Collectors.toList());

        // ── MỚI: Top 5 sản phẩm bán chạy ────────────────────────────────
        List<Object[]> topRows = orderRepository
            .getTopSellingProducts(PageRequest.of(0, 5))
            .getContent();
        List<TopProduct> topSellingProducts = topRows.stream()
            .map(r -> TopProduct.builder()
                .productId(((Number) r[0]).longValue())
                .productName((String) r[1])
                .imageUrl((String) r[2])
                .totalSold(((Number) r[3]).longValue())
                .totalRevenue(new BigDecimal(r[4].toString()))
                .build())
            .collect(Collectors.toList());

        // ── MỚI: Top 8 sản phẩm tồn kho thấp ────────────────────────────
        Pageable lowStockPage = PageRequest.of(0, 8);
        List<Product> lowStockEntities =
            productRepository.findLowStockProducts(LOW_STOCK_THRESHOLD, lowStockPage);
        List<LowStockItem> lowStockProducts = lowStockEntities.stream()
            .map(p -> LowStockItem.builder()
                .productId(p.getId())
                .productName(p.getName())
                .imageUrl(p.getImageUrl())
                .stockQty(p.getStockQty())
                .sku(p.getSku())
                .build())
            .collect(Collectors.toList());

        return DashboardStatsResponse.builder()
            .totalUsers(userRepository.count())
            .totalOrders(orderRepository.count())
            .totalProducts(productRepository.count())
            .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
            .pendingOrders(orderRepository.countByStatus(OrderStatus.AWAITING_PAYMENT))
            .todayOrders(orderRepository.countOrdersByDateRange(todayStart, todayEnd))
            .todayRevenue(todayRevenue != null ? todayRevenue : BigDecimal.ZERO)
            .revenueByDay(revenueByDay)
            .topSellingProducts(topSellingProducts)
            .lowStockProducts(lowStockProducts)
            .build();
    }

    @Override
    public PageResponse<UserResponse> getUsers(Pageable pageable, String keyword) {
        return PageResponse.of(
            userRepository.searchUsers(keyword, pageable).map(this::toUserResponse)
        );
    }

    @Override
    @Transactional
    public UserResponse toggleUserStatus(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user ID: " + id));
        user.setEnabled(!user.getEnabled());
        return toUserResponse(userRepository.save(user));
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .phone(user.getPhone())
            .address(user.getAddress())
            .role(user.getRole().name())
            .enabled(user.getEnabled())
            .createdAt(user.getCreatedAt())
            .build();
    }
}