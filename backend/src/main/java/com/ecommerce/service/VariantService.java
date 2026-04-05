package com.ecommerce.service;

import com.ecommerce.dto.request.ProductVariantRequest;
import com.ecommerce.dto.request.ProductVariantRequest.*;
import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.BusinessException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VariantService {

    private final ProductRepository productRepository;
    private final VariantOptionRepository variantOptionRepository;
    private final VariantValueRepository variantValueRepository;
    private final ProductVariantRepository variantRepository;
    private final VariantImageRepository variantImageRepository;
    private final CloudinaryService cloudinaryService;

    @Transactional(readOnly = true)
    public List<ProductResponse.VariantSkuResponse> getVariants(Long productId) {
        List<ProductVariant> withValues = variantRepository.findByProductIdWithValues(productId);
        Map<Long, List<String>> imagesMap = buildImagesMap(productId);
        return withValues.stream()
                .map(v -> toSkuResponse(v, imagesMap.getOrDefault(v.getId(), List.of())))
                .toList();
    }

    @Transactional
    public void saveVariants(Long productId,
                             ProductVariantRequest req,
                             Map<String, List<MultipartFile>> imagesByIndex) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm: " + productId));

        Map<String, VariantValue> valueMap = new HashMap<>();

        for (VariantOptionDto optDto : req.getOptions()) {
            VariantOption option = optDto.getId() != null
                    ? variantOptionRepository.findById(optDto.getId()).orElse(new VariantOption())
                    : new VariantOption();

            option.setProduct(product);
            option.setName(optDto.getName().trim());
            option.setSortOrder(optDto.getSortOrder() != null ? optDto.getSortOrder() : 0);
            variantOptionRepository.save(option);

            Set<Long> keepValueIds = optDto.getValues().stream()
                    .filter(v -> v.getId() != null)
                    .map(VariantValueDto::getId)
                    .collect(Collectors.toSet());
            if (keepValueIds.isEmpty()) {
                variantValueRepository.deleteAllByOptionId(option.getId());
            } else {
                variantValueRepository.deleteByOptionIdAndIdNotIn(option.getId(), keepValueIds);
            }

            for (VariantValueDto valDto : optDto.getValues()) {
                VariantValue value = valDto.getId() != null
                        ? variantValueRepository.findById(valDto.getId()).orElse(new VariantValue())
                        : new VariantValue();

                value.setVariantOption(option);
                value.setValue(valDto.getValue().trim());
                value.setSortOrder(valDto.getSortOrder() != null ? valDto.getSortOrder() : 0);
                variantValueRepository.save(value);
                valueMap.put(value.getValue(), value);
            }
        }

        List<VariantSkuDto> skuDtos = req.getSkus();
        for (int i = 0; i < skuDtos.size(); i++) {
            VariantSkuDto skuDto = skuDtos.get(i);

            if (Boolean.TRUE.equals(skuDto.getDeleted())) {
                if (skuDto.getId() != null) {
                    variantImageRepository.findByVariantId(skuDto.getId())
                            .forEach(img -> cloudinaryService.deleteImage(img.getImageUrl()));
                    variantRepository.deleteById(skuDto.getId());
                }
                continue;
            }

            ProductVariant variant = skuDto.getId() != null
                    ? variantRepository.findById(skuDto.getId()).orElse(new ProductVariant())
                    : new ProductVariant();

            variant.setProduct(product);
            variant.setPrice(skuDto.getPrice());
            variant.setSalePrice(skuDto.getSalePrice());
            variant.setStockQty(skuDto.getStockQty() != null ? skuDto.getStockQty() : 0);
            variant.setActive(skuDto.getActive() != null ? skuDto.getActive() : true);
            variant.setSortOrder(i);

            if (skuDto.getSku() != null && !skuDto.getSku().isBlank()) {
                variant.setSku(skuDto.getSku().trim());
            } else if (variant.getSku() == null) {
                String suffix = skuDto.getValueLabels().stream()
                        .map(s -> s.replaceAll("\\s+", "").toUpperCase())
                        .collect(Collectors.joining("-"));
                variant.setSku("PRD" + productId + "-" + suffix);
            }

            List<VariantValue> values = skuDto.getValueLabels().stream()
                    .map(label -> {
                        VariantValue v = valueMap.get(label);
                        if (v == null) throw new BusinessException("Không tìm thấy value: " + label);
                        return v;
                    }).collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));
            variant.setVariantValues(values);
            variantRepository.save(variant);

            syncImages(variant, skuDto, imagesByIndex, i);
        }
    }

    @Transactional
    public void deleteAllVariants(Long productId) {
        variantRepository.findByProductIdOrderBySortOrder(productId)
                .forEach(v -> variantImageRepository.findByVariantId(v.getId())
                        .forEach(img -> cloudinaryService.deleteImage(img.getImageUrl())));
        variantOptionRepository.deleteByProductId(productId);
    }

    private void syncImages(ProductVariant variant,
                            VariantSkuDto skuDto,
                            Map<String, List<MultipartFile>> imagesByIndex,
                            int index) {

        Set<String> keepUrls = new HashSet<>(
                skuDto.getKeepImageUrls() != null ? skuDto.getKeepImageUrls() : List.of());

        variantImageRepository.findByVariantId(variant.getId()).forEach(img -> {
            if (!keepUrls.contains(img.getImageUrl())) {
                cloudinaryService.deleteImage(img.getImageUrl());
                variantImageRepository.delete(img);
            }
        });

        String key = String.valueOf(index);
        List<MultipartFile> newFiles = imagesByIndex != null
                ? imagesByIndex.getOrDefault(key, List.of())
                : List.of();

        if (newFiles.isEmpty()) return;

        long currentCount = variantImageRepository.countByVariantId(variant.getId());
        int sortOrder = (int) currentCount;

        for (MultipartFile file : newFiles) {
            if (file == null || file.isEmpty()) continue;
            try {
                String url = cloudinaryService.uploadImage(file, "ecommerce/variants");
                variantImageRepository.save(VariantImage.builder()
                        .variant(variant)
                        .imageUrl(url)
                        .sortOrder(sortOrder++)
                        .build());
                log.info("Uploaded variant image for variant {}: {}", variant.getId(), url);
            } catch (Exception e) {
                log.error("Upload ảnh variant {} thất bại: {}", variant.getId(), e.getMessage());
                throw new RuntimeException("Upload ảnh thất bại: " + e.getMessage());
            }
        }
    }

    private Map<Long, List<String>> buildImagesMap(Long productId) {
        return variantRepository.findByProductIdWithImages(productId).stream()
                .collect(Collectors.toMap(
                        ProductVariant::getId,
                        v -> v.getImages().stream().map(VariantImage::getImageUrl).toList()
                ));
    }

    private ProductResponse.VariantSkuResponse toSkuResponse(ProductVariant v, List<String> images) {
        return ProductResponse.VariantSkuResponse.builder()
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
                .images(images)
                .build();
    }
}