package com.ecommerce.service;

import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.ProductResponse;

import java.util.List;
import java.util.Map;

public interface SearchService {

    /**
     * Trả về suggestions cho FE cache:
     * {
     *   "keywords":   ["iphone", "samsung", "macbook", ...],
     *   "categories": ["Điện thoại", "Laptop", "Tai nghe", ...]
     * }
     */
    Map<String, List<String>> getSuggestions();

    /**
     * Tìm kiếm sản phẩm theo từ khóa, trả về tối đa `size` kết quả.
     */
    PageResponse<ProductResponse> search(String keyword, int size);
}
