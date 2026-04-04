package com.ecommerce.service.impl;

import com.ecommerce.dto.response.DashboardStatsResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.UserResponse;
import com.ecommerce.entity.User;
import com.ecommerce.enums.OrderStatus;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.AdminService;
import lombok.RequiredArgsConstructor;
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

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    @Override
    public DashboardStatsResponse getDashboardStats() {
        LocalDateTime todayStart = LocalDateTime.now().with(LocalTime.MIN);
        LocalDateTime todayEnd   = LocalDateTime.now().with(LocalTime.MAX);

        BigDecimal totalRevenue = orderRepository.getTotalRevenue();
        BigDecimal todayRevenue = orderRepository.getRevenueByDateRange(todayStart, todayEnd);

        // Revenue last 30 days grouped by day
        LocalDateTime since = LocalDateTime.now().minusDays(30);
        List<Object[]> rows = orderRepository.getRevenueGroupByDay(since);
        List<DashboardStatsResponse.RevenueByDay> revenueByDay = rows.stream()
            .map(row -> DashboardStatsResponse.RevenueByDay.builder()
                .date(row[0].toString())
                .revenue(new BigDecimal(row[1].toString()))
                .orders(Long.parseLong(row[2].toString()))
                .build()
            ).collect(Collectors.toList());

        return DashboardStatsResponse.builder()
            .totalUsers(userRepository.count())
            .totalOrders(orderRepository.count())
            .totalProducts(productRepository.count())
            .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
            .pendingOrders(orderRepository.countByStatus(OrderStatus.AWAITING_PAYMENT))
            .todayOrders(orderRepository.countOrdersByDateRange(todayStart, todayEnd))
            .todayRevenue(todayRevenue != null ? todayRevenue : BigDecimal.ZERO)
            .revenueByDay(revenueByDay)
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
