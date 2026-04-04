package com.ecommerce.service;

import com.ecommerce.dto.response.DashboardStatsResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.UserResponse;
import org.springframework.data.domain.Pageable;

public interface AdminService {
    DashboardStatsResponse getDashboardStats();
    PageResponse<UserResponse> getUsers(Pageable pageable, String keyword);
    UserResponse toggleUserStatus(Long id);
}
