package com.ecommerce.service;

import com.ecommerce.entity.Order;

public interface EmailService {

    void sendOrderConfirmation(Order order);

    void sendOrderStatusUpdate(Order order);

    void sendOtpEmail(String toEmail, String otp);
}