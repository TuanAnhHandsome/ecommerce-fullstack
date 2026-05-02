package com.ecommerce.service;

import com.ecommerce.entity.Order;
import com.ecommerce.entity.ReturnRequest;

public interface EmailService {

    void sendOrderConfirmation(Order order);

    void sendOrderStatusUpdate(Order order);

    void sendOtpEmail(String toEmail, String otp);

    // [MỚI] Xác nhận tạo yêu cầu hoàn hàng thành công
    void sendReturnRequestConfirmation(ReturnRequest returnRequest);

    // [MỚI] Thông báo khi admin cập nhật trạng thái
    void sendReturnStatusUpdate(ReturnRequest returnRequest);
}