package com.ecommerce.repository;

import com.ecommerce.entity.VariantValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Set;

public interface VariantValueRepository extends JpaRepository<VariantValue, Long> {

    /**
     * Xóa các value thuộc option này mà ID không có trong keepIds.
     * Dùng 2 query riêng để tránh lỗi Hibernate 6 với IS EMPTY trên tham số.
     */
    @Modifying
    @Query("DELETE FROM VariantValue v WHERE v.variantOption.id = :optionId AND v.id NOT IN :keepIds")
    void deleteByOptionIdAndIdNotIn(@Param("optionId") Long optionId,
                                    @Param("keepIds") Set<Long> keepIds);

    @Modifying
    @Query("DELETE FROM VariantValue v WHERE v.variantOption.id = :optionId")
    void deleteAllByOptionId(@Param("optionId") Long optionId);
}