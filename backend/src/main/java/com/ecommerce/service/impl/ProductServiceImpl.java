package com.ecommerce.service.impl;

import com.ecommerce.dto.request.ProductRequest;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.dto.response.ProductResponse.SpecItem;
import com.ecommerce.entity.*;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.*;
import com.ecommerce.service.CloudinaryService;
import com.ecommerce.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.*;
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
    private final ProductSpecRepository productSpecRepository;

    // ── Read ──────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getProducts(
            Pageable pageable, String keyword, Long categoryId,
            BigDecimal minPrice, BigDecimal maxPrice) {

        Specification<Product> spec = Specification
                .where(ProductSpecification.isActive())
                .and(ProductSpecification.hasKeyword(keyword))
                .and(ProductSpecification.hasCategory(categoryId))
                .and(ProductSpecification.minPrice(minPrice))
                .and(ProductSpecification.maxPrice(maxPrice));

        Page<Product> page = productRepository.findAll(spec, pageable);
        ProductBatchData batch = loadBatchData(productIdsOf(page));
        return PageResponse.of(page.map(p -> toResponse(p, batch)));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getProductsAdmin(
            Pageable pageable, String keyword, Long categoryId,
            BigDecimal minPrice, BigDecimal maxPrice) {

        // Không dùng isActive() → lấy cả sản phẩm đang ẩn
        Specification<Product> spec = Specification
                .where(ProductSpecification.hasKeyword(keyword))
                .and(ProductSpecification.hasCategory(categoryId))
                .and(ProductSpecification.minPrice(minPrice))
                .and(ProductSpecification.maxPrice(maxPrice));

        Page<Product> page = productRepository.findAll(spec, pageable);
        ProductBatchData batch = loadBatchData(productIdsOf(page));
        return PageResponse.of(page.map(p -> toResponse(p, batch)));
    }

    private List<Long> productIdsOf(Page<Product> page) {
        return page.getContent().stream().map(Product::getId).toList();
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

    // ── Write ─────────────────────────────────────────────────────────────────

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

        saveSpecs(saved, request.getSpecs());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request, List<MultipartFile> images) {
        Product product = findById(id);

        // Chỉ cập nhật các field được truyền vào, không override mặc định
        if (request.getCategoryId() != null) {
            product.setCategory(findCategory(request.getCategoryId()));
        }
        if (request.getName() != null) {
            product.setName(request.getName());
        }
        if (request.getDescription() != null) {
            product.setDescription(request.getDescription());
        }
        if (request.getPrice() != null) {
            product.setPrice(request.getPrice());
        }
        if (request.getSalePrice() != null) {
            product.setSalePrice(request.getSalePrice());
        }
        if (request.getStockQty() != null) {
            product.setStockQty(request.getStockQty());
        }
        if (request.getSku() != null) {
            product.setSku(request.getSku());
        }
        // FIX: Chỉ đổi active khi được truyền rõ ràng, không bao giờ mặc định = true
        if (request.getActive() != null) {
            product.setActive(request.getActive());
        }

        // Xóa ảnh được chọn
        if (request.getDeletedImageIds() != null && !request.getDeletedImageIds().isEmpty()) {
            List<ProductImage> toDelete = productImageRepository.findAllById(request.getDeletedImageIds());
            toDelete.forEach(img -> cloudinaryService.deleteImage(img.getUrl()));
            productImageRepository.deleteByIdIn(request.getDeletedImageIds());
        }

        // Thêm ảnh mới
        if (images != null && !images.isEmpty()) {
            saveImages(product, images);
        }

        // Cập nhật imageUrl
        List<ProductImage> remaining = productImageRepository.findByProductIdOrderBySortOrder(product.getId());
        product.setImageUrl(remaining.isEmpty() ? null : remaining.get(0).getUrl());

        // Specs replace-all
        saveSpecs(product, request.getSpecs());

        return toResponse(productRepository.save(product));
    }

    @Override
    @Transactional
    public void setActive(Long id, boolean active) {
        Product product = findById(id);
        product.setActive(active);
        productRepository.save(product);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Product product = findById(id);
        product.setActive(false);
        productRepository.save(product);
    }

    // ── Specs helper ──────────────────────────────────────────────────────────

    private void saveSpecs(Product product, List<ProductRequest.SpecItem> specItems) {
        productSpecRepository.deleteByProductId(product.getId());
        if (specItems == null || specItems.isEmpty())
            return;

        List<ProductSpec> entities = new ArrayList<>();
        for (int i = 0; i < specItems.size(); i++) {
            ProductRequest.SpecItem item = specItems.get(i);
            if (item.getKey() == null || item.getKey().isBlank())
                continue;
            if (item.getValue() == null || item.getValue().isBlank())
                continue;

            entities.add(ProductSpec.builder()
                    .product(product)
                    .specGroup(item.getGroup() != null ? item.getGroup().trim() : "Thông số kỹ thuật")
                    .specKey(item.getKey().trim())
                    .specValue(item.getValue().trim())
                    .sortOrder(item.getSortOrder() != null ? item.getSortOrder() : i)
                    .build());
        }
        productSpecRepository.saveAll(entities);
    }

    // ── toResponse ────────────────────────────────────────────────────────────

    /**
     * Dữ liệu phụ trợ (ảnh, review, biến thể, spec) đã được load sẵn cho CẢ TRANG
     * sản phẩm bằng vài query IN-clause, thay vì gọi lại DB cho từng sản phẩm.
     *
     * ⚠️ TRƯỚC ĐÂY: mỗi lần toResponse(Product) chạy sẽ tự bắn ra 7 query riêng
     * (ảnh, avgRating, reviewCount, variantOptions, variants+values, variants+images, specs).
     * Với 1 trang 12 sản phẩm, tổng cộng phát sinh tới ~85 query chỉ để render
     * MỘT trang danh sách (GET /products) — đây là N+1 nghiêm trọng nhất trong dự án.
     * Giờ chỉ còn 6 query CỐ ĐỊNH cho toàn trang, bất kể trang có bao nhiêu sản phẩm.
     */
    private record ProductBatchData(
            Map<Long, List<String>> imagesByProduct,
            Map<Long, Double> avgRatingByProduct,
            Map<Long, Integer> reviewCountByProduct,
            Map<Long, List<VariantOption>> optionsByProduct,
            Map<Long, List<ProductVariant>> variantsWithValuesByProduct,
            Map<Long, List<String>> variantImagesByVariantId,
            Map<Long, List<ProductSpec>> specsByProduct
    ) {}

    private ProductBatchData loadBatchData(List<Long> productIds) {
        if (productIds.isEmpty()) {
            return new ProductBatchData(Map.of(), Map.of(), Map.of(), Map.of(), Map.of(), Map.of(), Map.of());
        }

        Map<Long, List<String>> imagesByProduct = productImageRepository
                .findByProductIdInOrderBySortOrder(productIds).stream()
                .collect(Collectors.groupingBy(
                        img -> img.getProduct().getId(),
                        LinkedHashMap::new,
                        Collectors.mapping(ProductImage::getUrl, Collectors.toList())));

        Map<Long, Double> avgRatingByProduct = new HashMap<>();
        Map<Long, Integer> reviewCountByProduct = new HashMap<>();
        for (Object[] row : reviewRepository.aggregateByProductIds(productIds)) {
            Long productId = (Long) row[0];
            avgRatingByProduct.put(productId, (Double) row[1]);
            reviewCountByProduct.put(productId, ((Number) row[2]).intValue());
        }

        Map<Long, List<VariantOption>> optionsByProduct = variantOptionRepository
                .findByProductIdInOrderBySortOrder(productIds).stream()
                .collect(Collectors.groupingBy(
                        opt -> opt.getProduct().getId(), LinkedHashMap::new, Collectors.toList()));

        Map<Long, List<ProductVariant>> variantsWithValuesByProduct = variantRepository
                .findByProductIdInWithValues(productIds).stream()
                .collect(Collectors.groupingBy(
                        v -> v.getProduct().getId(), LinkedHashMap::new, Collectors.toList()));

        Map<Long, List<String>> variantImagesByVariantId = variantRepository
                .findByProductIdInWithImages(productIds).stream()
                .collect(Collectors.toMap(
                        ProductVariant::getId,
                        v -> v.getImages().stream().map(VariantImage::getUrl).toList()));

        Map<Long, List<ProductSpec>> specsByProduct = productSpecRepository
                .findByProductIdInOrdered(productIds).stream()
                .collect(Collectors.groupingBy(
                        s -> s.getProduct().getId(), LinkedHashMap::new, Collectors.toList()));

        return new ProductBatchData(imagesByProduct, avgRatingByProduct, reviewCountByProduct,
                optionsByProduct, variantsWithValuesByProduct, variantImagesByVariantId, specsByProduct);
    }

    /** Dùng cho danh sách sản phẩm — không tự bắn query, chỉ đọc từ batch đã load sẵn. */
    private ProductResponse toResponse(Product p, ProductBatchData batch) {
        List<String> imageUrls = batch.imagesByProduct().getOrDefault(p.getId(), List.of());
        if (imageUrls.isEmpty() && p.getImageUrl() != null) {
            imageUrls = List.of(p.getImageUrl());
        }

        Double avg = batch.avgRatingByProduct().get(p.getId());
        Integer reviewCount = batch.reviewCountByProduct().getOrDefault(p.getId(), 0);

        List<ProductResponse.VariantOptionResponse> variantOptions = batch.optionsByProduct()
                .getOrDefault(p.getId(), List.of()).stream()
                .map(opt -> ProductResponse.VariantOptionResponse.builder()
                        .id(opt.getId())
                        .name(opt.getName())
                        .sortOrder(opt.getSortOrder())
                        .values(opt.getValues().stream()
                                .map(v -> ProductResponse.VariantOptionResponse.ValueItem.builder()
                                        .id(v.getId()).value(v.getValue()).sortOrder(v.getSortOrder()).build())
                                .toList())
                        .build())
                .toList();

        List<ProductVariant> variantsWithValues = batch.variantsWithValuesByProduct()
                .getOrDefault(p.getId(), List.of());

        List<ProductResponse.VariantSkuResponse> variants = variantsWithValues.stream()
                .map(v -> ProductResponse.VariantSkuResponse.builder()
                        .id(v.getId()).sku(v.getSku()).price(v.getPrice())
                        .salePrice(v.getSalePrice()).effectivePrice(v.getEffectivePrice())
                        .stockQty(v.getStockQty()).active(v.getActive()).sortOrder(v.getSortOrder())
                        .valueLabels(v.getVariantValues().stream().map(VariantValue::getValue).toList())
                        .images(batch.variantImagesByVariantId().getOrDefault(v.getId(), List.of()))
                        .build())
                .toList();

        Map<String, List<SpecItem>> specsMap = new LinkedHashMap<>();
        batch.specsByProduct().getOrDefault(p.getId(), List.of()).forEach(s -> {
            specsMap.computeIfAbsent(s.getSpecGroup(), k -> new ArrayList<>())
                    .add(SpecItem.builder()
                            .key(s.getSpecKey())
                            .value(s.getSpecValue())
                            .sortOrder(s.getSortOrder())
                            .build());
        });

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
                .reviewCount(reviewCount)
                .soldCount(null)
                .variantOptions(variantOptions)
                .variants(variants)
                .specs(specsMap)
                .build();
    }

    /**
     * Dùng cho 1 sản phẩm đơn lẻ (chi tiết sản phẩm, sau khi tạo/cập nhật) — vẫn
     * chỉ chạy đúng 6 query cố định như trên (loadBatchData với 1 id), không phải
     * là "quay lại N+1", vì chỉ có 1 sản phẩm nên N=1 theo đúng nghĩa.
     */
    private ProductResponse toResponse(Product p) {
        return toResponse(p, loadBatchData(List.of(p.getId())));
    }

    // ── Utils ─────────────────────────────────────────────────────────────────

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