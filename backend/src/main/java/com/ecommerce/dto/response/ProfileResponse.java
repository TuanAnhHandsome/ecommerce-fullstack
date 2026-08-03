package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ProfileResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private String role;
    private LocalDateTime createdAt;
    private String avatarUrl;
}
