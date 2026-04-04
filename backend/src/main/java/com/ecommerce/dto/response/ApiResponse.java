package com.ecommerce.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse {
    private boolean success;
    private String message;
    private Object data;

    public static ApiResponse success(String message) {
        return ApiResponse.builder().success(true).message(message).build();
    }

    // THÊM METHOD NÀY VÀO ↓
    public static ApiResponse success(Object data) {
        return ApiResponse.builder().success(true).data(data).build();
    }

    public static ApiResponse error(String message) {
        return ApiResponse.builder().success(false).message(message).build();
    }
}
