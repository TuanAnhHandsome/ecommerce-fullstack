package com.ecommerce.service.impl;

import com.ecommerce.dto.request.ProductRequest;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.*;
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
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductImageRepository productImageRepository;
    private final VariantOptionRepository variantOptionRepository;
    private final ProductVariantRepository variantRepository;
    private final ReviewRepository reviewRepository;
    private final CloudinaryService cloudinaryService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getProducts(Pageable pageable, String keyword, Long categoryId) {
        return PageResponse.of(
                productRepository.searchProducts(keyword, categoryId, pageable)
                        .map(this::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        return toResponse(findById(id));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductBySlug(String slug) {
        return toResponse(productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm: " + slug)));
    }

    @Override
    @Transactional
    public ProductResponse createProduct(ProductRequest request, List<MultipartFile> images) {
        Category category = findCategory(request.getCategoryId());

        Product product = Product.builder()
                .category(category)
                .name(request.getName())
                .slug(generateSlug(request.getName()))
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
            saved = productRepository.findById(saved.getId()).orElseThrow();
        }

        return toResponse(saved);
    }

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

        if (request.getDeletedImageIds() != null && !request.getDeletedImageIds().isEmpty()) {
            List<ProductImage> toDelete = productImageRepository.findAllById(request.getDeletedImageIds());
            toDelete.forEach(img -> cloudinaryService.deleteImage(img.getUrl()));
            productImageRepository.deleteByIdIn(request.getDeletedImageIds());
        }

        if (images != null && !images.isEmpty()) {
            saveImages(product, images);
        }

        List<ProductImage> remaining = productImageRepository.findByProductIdOrderBySortOrder(product.getId());
        product.setImageUrl(remaining.isEmpty() ? null : remaining.get(0).getUrl());

        return toResponse(productRepository.save(product));
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Product product = findById(id);
        product.setActive(false);
        productRepository.save(product);
    }

    // ── Helpers ──────────────────────────────────────────────

    private void saveImages(Product product, List<MultipartFile> files) {
        List<ProductImage> existing = productImageRepository.findByProductIdOrderBySortOrder(product.getId());
        int startOrder = existing.size();

        for (int i = 0; i < files.size(); i++) {
            String url = cloudinaryService.uploadImage(files.get(i));
            productImageRepository.save(ProductImage.builder()
                    .product(product).url(url).sortOrder(startOrder + i).build());
        }

        if (startOrder == 0) {
            List<ProductImage> all = productImageRepository.findByProductIdOrderBySortOrder(product.getId());
            if (!all.isEmpty()) {
                product.setImageUrl(all.get(0).getUrl());
                productRepository.save(product);
            }
        }
    }

    private ProductResponse toResponse(Product p) {
        // ── Ảnh sản phẩm ──────────────────────────────────────
        List<String> imageUrls = productImageRepository
                .findByProductIdOrderBySortOrder(p.getId())
                .stream().map(ProductImage::getUrl).toList();

        if (imageUrls.isEmpty() && p.getImageUrl() != null) {
            imageUrls = List.of(p.getImageUrl());
        }

        // ── Review summary ─────────────────────────────────────
        Double avg = reviewRepository.avgRatingByProduct(p.getId());
        Integer reviewCount = reviewRepository.countByProduct(p.getId());

        // ── Variant options (dùng EntityGraph — fetch values luôn) ──
        List<ProductResponse.VariantOptionResponse> variantOptions = variantOptionRepository
                .findByProductIdOrderBySortOrder(p.getId())
                .stream().map(opt -> ProductResponse.VariantOptionResponse.builder()
                        .id(opt.getId())
                        .name(opt.getName())
                        .sortOrder(opt.getSortOrder())
                        .values(opt.getValues().stream()
                                .map(v -> ProductResponse.VariantOptionResponse.ValueItem.builder()
                                        .id(v.getId()).value(v.getValue()).sortOrder(v.getSortOrder()).build())
                                .toList())
                        .build())
                .toList();

        // ── Variants: fetch values và images bằng 2 query riêng ──
        List<ProductVariant> variantsWithValues =
                variantRepository.findByProductIdWithValues(p.getId());

        Map<Long, List<String>> imagesMap =
                variantRepository.findByProductIdWithImages(p.getId()).stream()
                        .collect(Collectors.toMap(
                                ProductVariant::getId,
                                v -> v.getImages().stream().map(VariantImage::getUrl).toList()
                        ));

        List<ProductResponse.VariantSkuResponse> variants = variantsWithValues.stream()
                .map(v -> ProductResponse.VariantSkuResponse.builder()
                        .id(v.getId())
                        .sku(v.getSku())
                        .price(v.getPrice())
                        .salePrice(v.getSalePrice())
                        .effectivePrice(v.getEffectivePrice())
                        .stockQty(v.getStockQty())
                        .active(v.getActive())
                        .sortOrder(v.getSortOrder())
                        .valueLabels(v.getVariantValues().stream()
                                .map(VariantValue::getValue).toList())
                        .images(imagesMap.getOrDefault(v.getId(), List.of()))
                        .build())
                .toList();

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
                .avgRating(avg != null ? Math.round(avg * 10.0) / 10.0 : null)
                .reviewCount(reviewCount != null ? reviewCount : 0)
                .soldCount(null)
                .variantOptions(variantOptions)
                .variants(variants)
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
        String slug = Pattern.compile("\\p{InCombiningDiacriticalMarks}+")
                .matcher(normalized).replaceAll("")
                .toLowerCase()
                .replace("đ", "d")
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .trim();

        String base = slug;
        int count = 1;
        while (productRepository.existsBySlug(slug))
            slug = base + "-" + count++;
        return slug;
    }
}