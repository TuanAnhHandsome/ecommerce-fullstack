package com.ecommerce.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private Long userId;
    private String userName;
    private Long productId;   // để FE biết item nào đã reviewed
    private Long orderId;     // để FE check per order
    private Byte rating;
    private String title;
    private String comment;
    private Boolean verified;
    private List<String> images;
    private LocalDateTime createdAt;
}