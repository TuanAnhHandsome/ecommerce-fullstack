package com.ecommerce.service;

import com.ecommerce.dto.request.CreateOrderRequest;
import com.ecommerce.dto.response.OrderResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.entity.Order;
import org.springframework.data.domain.Pageable;

public interface OrderService {
    OrderResponse createOrder(String email, CreateOrderRequest request);
    OrderResponse getOrderById(String email, Long id);
    PageResponse<OrderResponse> getMyOrders(String email, Pageable pageable);
    PageResponse<OrderResponse> getAllOrders(Pageable pageable, String status);
    OrderResponse updateOrderStatus(Long id, String status);
    Order getOrderEntityForPayment(String email, Long orderId);
}
