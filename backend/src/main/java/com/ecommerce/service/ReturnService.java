package com.ecommerce.service;

import com.ecommerce.dto.request.AdminUpdateReturnRequest;
import com.ecommerce.dto.request.CreateReturnRequest;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.ReturnResponse;
import org.springframework.data.domain.Pageable;

public interface ReturnService {

    /** Khách tạo yêu cầu hoàn hàng từ đơn DELIVERED */
    ReturnResponse create(String email, CreateReturnRequest request);

    /** Khách xem danh sách yêu cầu của mình */
    PageResponse<ReturnResponse> getMyReturns(String email, Pageable pageable);

    /** Khách xem chi tiết 1 yêu cầu */
    ReturnResponse getById(String email, Long id);

    /** Admin: danh sách tất cả, filter status + keyword */
    PageResponse<ReturnResponse> adminList(String status, String keyword, Pageable pageable);

    /** Admin: cập nhật trạng thái + ghi chú */
    ReturnResponse adminUpdate(Long id, AdminUpdateReturnRequest request);
}
