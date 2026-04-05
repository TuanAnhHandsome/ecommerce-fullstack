package com.ecommerce.dto.response;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReviewSummaryResponse {
    private Double avgRating;
    private Integer totalCount;
    private Map<Integer, Long> distribution;  // {5: 143, 4: 59, 3: 25, 2: 12, 1: 8}
    private List<ReviewResponse> reviews;
    private int totalPages;
    private int currentPage;
}