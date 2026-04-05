package com.ecommerce.repository;

import com.ecommerce.entity.VariantImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VariantImageRepository extends JpaRepository<VariantImage, Long> {

    List<VariantImage> findByVariantId(Long variantId);

    long countByVariantId(Long variantId);

    void deleteByVariantId(Long variantId);
}