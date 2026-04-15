package com.ecommerce.service;

import com.ecommerce.dto.request.ProductRequest;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.ProductResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

public interface ProductService {
    PageResponse<ProductResponse> getProducts(
            Pageable pageable,
            String keyword,
            Long categoryId,
            BigDecimal minPrice,   // ← thêm
            BigDecimal maxPrice);  // ← thêm

    ProductResponse getProductById(Long id);
    ProductResponse getProductBySlug(String slug);
    ProductResponse createProduct(ProductRequest request, List<MultipartFile> images);
    ProductResponse updateProduct(Long id, ProductRequest request, List<MultipartFile> images);
    void deleteProduct(Long id);
}