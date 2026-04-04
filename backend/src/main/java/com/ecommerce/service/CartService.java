package com.ecommerce.service;

import com.ecommerce.dto.request.CartItemRequest;
import com.ecommerce.dto.response.CartResponse;

public interface CartService {
    CartResponse getCart(String email);
    CartResponse addItem(String email, CartItemRequest request);
    CartResponse updateItem(String email, Long productId, int quantity);
    void removeItem(String email, Long productId);
    void clearCart(String email);
}
