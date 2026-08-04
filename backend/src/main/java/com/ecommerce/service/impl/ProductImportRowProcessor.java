package com.ecommerce.service.impl;

import com.ecommerce.entity.*;
import com.ecommerce.exception.BusinessException;
import com.ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Tách riêng khỏi ProductImportServiceImpl để @Transactional hoạt động đúng
 * (self-invocation trong cùng 1 class không tạo transaction proxy mới trong Spring).
 *
 * Mỗi lời gọi importOneProduct() là 1 transaction độc lập → nếu 1 sản phẩm lỗi
 * (VD: constraint DB), chỉ sản phẩm đó rollback, các sản phẩm khác trong batch
 * đã import trước đó không bị ảnh hưởng.
 */
@Service
@RequiredArgsConstructor
public class ProductImportRowProcessor {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductSpecRepository productSpecRepository;
    private final VariantOptionRepository variantOptionRepository;
    private final VariantValueRepository variantValueRepository;
    private final ProductVariantRepository productVariantRepository;
    private final VariantImageRepository variantImageRepository;

    @Transactional
    public Long importOneProduct(ProductImportServiceImpl.ImportGroup group) {
        var row = group.product();

        Category category = categoryRepository.findByNameIgnoreCase(row.categoryName().trim())
                .orElseThrow(() -> new BusinessException("Không tìm thấy danh mục: " + row.categoryName()));

        boolean hasVariants = !group.variants().isEmpty();

        Product product = Product.builder()
                .category(category)
                .name(row.name())
                .slug(generateSlug(row.name()))
                .description(row.description())
                .price(row.price())
                .salePrice(row.salePrice())
                .stockQty(hasVariants ? 0 : Optional.ofNullable(row.stockQty()).orElse(0))
                .sku(hasVariants ? null : row.sku())
                .active(row.active() != null ? row.active() : true)
                .build();

        product = productRepository.save(product);

        // Ảnh chính — lưu thẳng URL, không upload lại Cloudinary
        List<String> mainUrls = splitUrls(row.mainImageUrl());
        for (int i = 0; i < mainUrls.size(); i++) {
            productImageRepository.save(ProductImage.builder()
                    .product(product).url(mainUrls.get(i)).sortOrder(i).build());
        }
        if (!mainUrls.isEmpty()) {
            product.setImageUrl(mainUrls.get(0));
            productRepository.save(product);
        }

        // Thông số kỹ thuật
        int specOrder = 0;
        for (var spec : group.specs()) {
            if (spec.key() == null || spec.key().isBlank() || spec.value() == null || spec.value().isBlank())
                continue;
            productSpecRepository.save(ProductSpec.builder()
                    .product(product)
                    .specGroup(spec.group() != null && !spec.group().isBlank() ? spec.group().trim() : "Thông số kỹ thuật")
                    .specKey(spec.key().trim())
                    .specValue(spec.value().trim())
                    .sortOrder(specOrder++)
                    .build());
        }

        if (hasVariants) {
            importVariants(product, group.variants());
        }

        return product.getId();
    }

    private void importVariants(Product product, List<ProductImportServiceImpl.VariantRow> rows) {
        // Bước 1: gom option + value theo đúng thứ tự xuất hiện trong file
        Map<String, LinkedHashSet<String>> optionValues = new LinkedHashMap<>();
        for (var r : rows) {
            for (String[] pair : r.options()) {
                optionValues.computeIfAbsent(pair[0], k -> new LinkedHashSet<>()).add(pair[1]);
            }
        }

        // Bước 2: tạo VariantOption + VariantValue, giữ map tra cứu nhanh
        Map<String, VariantValue> valueByKey = new HashMap<>(); // key = "TenLoai||GiaTri"
        int oi = 0;
        for (var entry : optionValues.entrySet()) {
            VariantOption option = variantOptionRepository.save(VariantOption.builder()
                    .product(product).name(entry.getKey()).sortOrder(oi++).build());

            int vi = 0;
            for (String val : entry.getValue()) {
                VariantValue saved = variantValueRepository.save(VariantValue.builder()
                        .variantOption(option).value(val).sortOrder(vi++).build());
                valueByKey.put(entry.getKey() + "||" + val, saved);
            }
        }

        // Bước 3: tạo từng SKU + gán variantValues + ảnh riêng
        int si = 0;
        for (var r : rows) {
            List<VariantValue> values = new ArrayList<>();
            for (String[] pair : r.options()) {
                VariantValue v = valueByKey.get(pair[0] + "||" + pair[1]);
                if (v != null) values.add(v);
            }

            ProductVariant variant = ProductVariant.builder()
                    .product(product)
                    .sku(r.sku())
                    .price(r.price())
                    .salePrice(r.salePrice())
                    .stockQty(Optional.ofNullable(r.stockQty()).orElse(0))
                    .active(true)
                    .sortOrder(si++)
                    .variantValues(values)
                    .build();
            variant = productVariantRepository.save(variant);

            List<String> imgUrls = splitUrls(r.imageUrls());
            for (int i = 0; i < imgUrls.size(); i++) {
                variantImageRepository.save(VariantImage.builder()
                        .variant(variant).imageUrl(imgUrls.get(i)).sortOrder(i).build());
            }
        }
    }

    private List<String> splitUrls(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        return Arrays.stream(raw.split("[;,]"))
                .map(String::trim).filter(s -> !s.isBlank()).toList();
    }

    // Trùng logic với ProductServiceImpl.generateSlug() — nên tách ra 1 SlugUtils dùng chung khi refactor.
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
