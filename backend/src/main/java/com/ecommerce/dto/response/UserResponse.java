package com.ecommerce.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private String role;
    private Boolean enabled;
    private LocalDateTime createdAt;
    private String avatarUrl;
}
