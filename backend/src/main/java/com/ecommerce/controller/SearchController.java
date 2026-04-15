package com.ecommerce.controller;

import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    /**
     * GET /api/search/suggestions
     * Trả về danh sách từ khóa phổ biến + danh mục.
     * FE fetch 1 lần khi mount, lưu vào memory (không gọi lại).
     * Cache 10 phút bằng HTTP Cache-Control.
     */
    @GetMapping("/suggestions")
    public ResponseEntity<Map<String, List<String>>> getSuggestions() {
        return ResponseEntity.ok()
                .header("Cache-Control", "public, max-age=600")
                .body(searchService.getSuggestions());
    }

    /**
     * GET /api/search?q=iphone&size=8
     * Tìm kiếm sản phẩm theo từ khóa — gọi từ FE mỗi khi user gõ (debounce 300ms).
     * Backend dùng LIKE query trên PostgreSQL (đã có GIN index nếu thêm pg_trgm).
     * Trả về tối đa `size` kết quả (default 8, cap 20).
     *
     * @param q    từ khóa tìm kiếm (tối thiểu 2 ký tự, FE đã validate)
     * @param size số kết quả trả về (default 8)
     */
    @GetMapping
    public ResponseEntity<PageResponse<ProductResponse>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "8") int size
    ) {
        if (q == null || q.trim().length() < 2) {
            return ResponseEntity.badRequest().build();
        }
        size = Math.min(size, 20);
        return ResponseEntity.ok(searchService.search(q.trim(), size));
    }
}
