package com.ecommerce.service.impl;

import com.ecommerce.dto.request.ProductRequest;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.entity.Category;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.ProductImage;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.repository.ProductImageRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.service.CloudinaryService;
import com.ecommerce.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductImageRepository productImageRepository;
    private final CloudinaryService cloudinaryService;

    // ── Public read ──────────────────────────────────────────────

    @Override
    public PageResponse<ProductResponse> getProducts(Pageable pageable, String keyword, Long categoryId) {
        return PageResponse.of(
                productRepository.searchProducts(keyword, categoryId, pageable)
                        .map(this::toResponse));
    }

    @Override
    public ProductResponse getProductById(Long id) {
        return toResponse(findById(id));
    }

    @Override
    public ProductResponse getProductBySlug(String slug) {
        return toResponse(
                productRepository.findBySlug(slug)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm: " + slug)));
    }

    // ── Create ───────────────────────────────────────────────────

    @Override
    @Transactional
    public ProductResponse createProduct(ProductRequest request, List<MultipartFile> images) {
        Category category = findCategory(request.getCategoryId());
        String slug = generateSlug(request.getName());

        Product product = Product.builder()
                .category(category)
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .price(request.getPrice())
                .salePrice(request.getSalePrice())
                .stockQty(request.getStockQty())
                .sku(request.getSku())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        Product saved = productRepository.save(product);

        if (images != null && !images.isEmpty()) {
            saveImages(saved, images);
            // Reload để lấy imageUrl đã được sync
            saved = productRepository.findById(saved.getId()).orElseThrow();
        }

        return toResponse(saved);
    }

    // ── Update ───────────────────────────────────────────────────

    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request, List<MultipartFile> images) {
        Product product = findById(id);
        Category category = findCategory(request.getCategoryId());

        product.setCategory(category);
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setSalePrice(request.getSalePrice());
        product.setStockQty(request.getStockQty());
        product.setSku(request.getSku());
        product.setActive(request.getActive() != null ? request.getActive() : true);

        // Xoá ảnh được chỉ định
        if (request.getDeletedImageIds() != null && !request.getDeletedImageIds().isEmpty()) {
            List<ProductImage> toDelete = productImageRepository.findAllById(request.getDeletedImageIds());
            toDelete.forEach(img -> cloudinaryService.deleteImage(img.getUrl()));
            productImageRepository.deleteByIdIn(request.getDeletedImageIds());
        }

        // Upload ảnh mới
        if (images != null && !images.isEmpty()) {
            saveImages(product, images);
        }

        // Sync imageUrl = ảnh đầu tiên còn lại
        List<ProductImage> remaining = productImageRepository.findByProductIdOrderBySortOrder(product.getId());
        product.setImageUrl(remaining.isEmpty() ? null : remaining.get(0).getUrl());

        return toResponse(productRepository.save(product));
    }

    // ── Delete (soft) ────────────────────────────────────────────

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Product product = findById(id);
        product.setActive(false);
        productRepository.save(product);
    }

    // ── Private helpers ──────────────────────────────────────────

    private void saveImages(Product product, List<MultipartFile> files) {
        List<ProductImage> existing = productImageRepository.findByProductIdOrderBySortOrder(product.getId());
        int startOrder = existing.size();

        for (int i = 0; i < files.size(); i++) {
            String url = cloudinaryService.uploadImage(files.get(i));
            productImageRepository.save(ProductImage.builder()
                    .product(product)
                    .url(url)
                    .sortOrder(startOrder + i)
                    .build());
        }

        // Sync imageUrl = ảnh đầu tiên (thumbnail backward compat)
        if (startOrder == 0) {
            List<ProductImage> all = productImageRepository.findByProductIdOrderBySortOrder(product.getId());
            if (!all.isEmpty()) {
                product.setImageUrl(all.get(0).getUrl());
                productRepository.save(product);
            }
        }
    }

    private ProductResponse toResponse(Product p) {
        List<String> imageUrls = productImageRepository
                .findByProductIdOrderBySortOrder(p.getId())
                .stream()
                .map(ProductImage::getUrl)
                .toList();

        // Fallback nếu chưa migrate ảnh cũ
        if (imageUrls.isEmpty() && p.getImageUrl() != null) {
            imageUrls = List.of(p.getImageUrl());
        }

        return ProductResponse.builder()
                .id(p.getId())
                .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .name(p.getName())
                .slug(p.getSlug())
                .description(p.getDescription())
                .price(p.getPrice())
                .salePrice(p.getSalePrice())
                .effectivePrice(p.getEffectivePrice())
                .stockQty(p.getStockQty())
                .imageUrl(p.getImageUrl())
                .images(imageUrls)
                .sku(p.getSku())
                .active(p.getActive())
                .createdAt(p.getCreatedAt())
                .build();
    }

    private Product findById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm ID: " + id));
    }

    private Category findCategory(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục ID: " + categoryId));
    }

    private String generateSlug(String name) {
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String slug = pattern.matcher(normalized).replaceAll("")
                .toLowerCase()
                .replace("đ", "d")
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .trim();

        String baseSlug = slug;
        int count = 1;
        while (productRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + count++;
        }
        return slug;
    }
}