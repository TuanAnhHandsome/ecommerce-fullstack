package com.ecommerce.service.impl;

import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.service.ProductService;
import com.ecommerce.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SearchServiceImpl implements SearchService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductService productService;   // tái dùng getProducts() đã có

    /**
     * Suggestions = tên sản phẩm bán chạy nhất (top 20) + tất cả danh mục.
     * Nếu sau này có bảng search_log thì thay bằng top keywords từ log.
     */
    @Override
    @Transactional(readOnly = true)
    public Map<String, List<String>> getSuggestions() {
        List<String> keywords = productRepository.findTopProductNames(PageRequest.of(0, 20));
        
        List<String> categories = categoryRepository.findAllCategoryNames();
        
        return Map.of(
                "keywords", keywords,
                "categories", categories
        );
    }

    /**
     * Tìm kiếm: tái dùng searchProducts() đã có trong ProductRepository.
     * Sắp xếp theo createdAt DESC (sản phẩm mới nhất lên đầu).
     */
    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> search(String keyword, int size) {
        var pageable = PageRequest.of(0, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return productService.getProducts(pageable, keyword, null, null, null);
    }
}
