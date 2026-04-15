package com.ecommerce.service;

import com.ecommerce.dto.request.CouponRequest;
import com.ecommerce.dto.response.CouponResponse;
import com.ecommerce.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface CouponService {

    /** Khách hàng kiểm tra + tính tiền giảm */
    CouponResponse apply(String code, BigDecimal orderTotal, Long userId);

    /** Admin CRUD */
    PageResponse<CouponResponse> list(String keyword, Pageable pageable);
    CouponResponse create(CouponRequest request);
    CouponResponse update(Long id, CouponRequest request);
    void           delete(Long id);
    CouponResponse getById(Long id);
}
