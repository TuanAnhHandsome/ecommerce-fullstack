package com.ecommerce.service;

import com.ecommerce.dto.request.CreateWarrantyRequest;
import com.ecommerce.dto.request.UpdateWarrantyRequest;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.WarrantyResponse;
import org.springframework.data.domain.Pageable;

public interface WarrantyService {

    /** Khách hàng tạo yêu cầu */
    WarrantyResponse create(String email, CreateWarrantyRequest request);

    /** Khách hàng xem yêu cầu của mình */
    PageResponse<WarrantyResponse> getMyRequests(String email, Pageable pageable);

    /** Tra cứu công khai theo mã yêu cầu hoặc SĐT */
    WarrantyResponse lookup(String requestCode);

    /** Admin: danh sách tất cả */
    PageResponse<WarrantyResponse> adminList(String status, String keyword, Pageable pageable);

    /** Admin: cập nhật trạng thái + ghi chú */
    WarrantyResponse adminUpdate(Long id, UpdateWarrantyRequest request);
}
