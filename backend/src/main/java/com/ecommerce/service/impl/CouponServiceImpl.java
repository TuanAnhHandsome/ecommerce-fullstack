package com.ecommerce.service.impl;

import com.ecommerce.dto.request.CouponRequest;
import com.ecommerce.dto.response.CouponResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.entity.Coupon;
import com.ecommerce.enums.DiscountType;
import com.ecommerce.exception.BusinessException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.CouponRepository;
import com.ecommerce.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;

    @Override
    @Transactional(readOnly = true)
    public CouponResponse apply(String code, BigDecimal orderTotal, Long userId) {
        Coupon coupon = couponRepository.findByCodeIgnoreCase(code)
            .orElseThrow(() -> new BusinessException("Mã giảm giá không tồn tại"));

        if (!coupon.getActive())
            throw new BusinessException("Mã giảm giá đã bị tắt");

        LocalDateTime now = LocalDateTime.now();
        if (coupon.getStartsAt() != null && now.isBefore(coupon.getStartsAt()))
            throw new BusinessException("Mã giảm giá chưa có hiệu lực");

        if (coupon.getExpiresAt() != null && now.isAfter(coupon.getExpiresAt()))
            throw new BusinessException("Mã giảm giá đã hết hạn");

        if (coupon.getMinOrderAmount() != null
                && orderTotal.compareTo(coupon.getMinOrderAmount()) < 0)
            throw new BusinessException(
                "Đơn hàng tối thiểu " + formatVnd(coupon.getMinOrderAmount()) + " để dùng mã này");

        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit())
            throw new BusinessException("Mã giảm giá đã hết lượt sử dụng");

        if (userId != null && coupon.getPerUserLimit() != null) {
            long userUsed = couponRepository.countUsageByUser(code, userId);
            if (userUsed >= coupon.getPerUserLimit())
                throw new BusinessException("Bạn đã dùng hết lượt sử dụng mã này");
        }

        BigDecimal discount = calcDiscount(coupon, orderTotal);
        CouponResponse resp = toResponse(coupon);
        resp.setDiscountAmount(discount);
        return resp;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CouponResponse> list(String keyword, Pageable pageable) {
        return PageResponse.of(couponRepository.search(keyword, pageable).map(this::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public CouponResponse getById(Long id) {
        return toResponse(findById(id));
    }

    @Override
    @Transactional
    public CouponResponse create(CouponRequest req) {
        if (couponRepository.existsByCodeIgnoreCase(req.getCode()))
            throw new BusinessException("Mã coupon đã tồn tại: " + req.getCode());

        Coupon coupon = Coupon.builder()
            .code(req.getCode().toUpperCase().trim())
            .description(req.getDescription())
            .discountType(DiscountType.valueOf(req.getDiscountType().toUpperCase()))
            .discountValue(req.getDiscountValue())
            .maxDiscountAmount(req.getMaxDiscountAmount())
            .minOrderAmount(req.getMinOrderAmount() != null ? req.getMinOrderAmount() : BigDecimal.ZERO)
            .usageLimit(req.getUsageLimit())
            .perUserLimit(req.getPerUserLimit())
            .active(req.getActive() != null ? req.getActive() : true)
            .startsAt(req.getStartsAt())
            .expiresAt(req.getExpiresAt())
            .build();

        return toResponse(couponRepository.save(coupon));
    }

    @Override
    @Transactional
    public CouponResponse update(Long id, CouponRequest req) {
        Coupon coupon = findById(id);

        if (!coupon.getCode().equalsIgnoreCase(req.getCode())
                && couponRepository.existsByCodeIgnoreCase(req.getCode()))
            throw new BusinessException("Mã coupon đã tồn tại: " + req.getCode());

        coupon.setCode(req.getCode().toUpperCase().trim());
        coupon.setDescription(req.getDescription());
        coupon.setDiscountType(DiscountType.valueOf(req.getDiscountType().toUpperCase()));
        coupon.setDiscountValue(req.getDiscountValue());
        coupon.setMaxDiscountAmount(req.getMaxDiscountAmount());
        coupon.setMinOrderAmount(req.getMinOrderAmount() != null ? req.getMinOrderAmount() : BigDecimal.ZERO);
        coupon.setUsageLimit(req.getUsageLimit());
        coupon.setPerUserLimit(req.getPerUserLimit());
        coupon.setActive(req.getActive() != null ? req.getActive() : coupon.getActive());
        coupon.setStartsAt(req.getStartsAt());
        coupon.setExpiresAt(req.getExpiresAt());

        return toResponse(couponRepository.save(coupon));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        couponRepository.delete(findById(id));
    }

    public BigDecimal calcDiscount(Coupon coupon, BigDecimal orderTotal) {
        BigDecimal discount;
        if (coupon.getDiscountType() == DiscountType.PERCENT) {
            discount = orderTotal
                .multiply(coupon.getDiscountValue())
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
            if (coupon.getMaxDiscountAmount() != null)
                discount = discount.min(coupon.getMaxDiscountAmount());
        } else {
            discount = coupon.getDiscountValue();
        }
        return discount.min(orderTotal);
    }

    private Coupon findById(Long id) {
        return couponRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy coupon ID: " + id));
    }

    private CouponResponse toResponse(Coupon c) {
        return CouponResponse.builder()
            .id(c.getId())
            .code(c.getCode())
            .description(c.getDescription())
            .discountType(c.getDiscountType().name())
            .discountValue(c.getDiscountValue())
            .maxDiscountAmount(c.getMaxDiscountAmount())
            .minOrderAmount(c.getMinOrderAmount())
            .usageLimit(c.getUsageLimit())
            .usedCount(c.getUsedCount())
            .perUserLimit(c.getPerUserLimit())
            .active(c.getActive())
            .startsAt(c.getStartsAt())
            .expiresAt(c.getExpiresAt())
            .createdAt(c.getCreatedAt())
            .build();
    }

    private String formatVnd(BigDecimal amount) {
        return String.format("%,.0fđ", amount);
    }
}