package com.ecommerce.service;

import com.ecommerce.dto.request.CartItemRequest;
import com.ecommerce.dto.response.CartResponse;

public interface CartService {
    CartResponse getCart(String email);
    CartResponse addItem(String email, CartItemRequest request);
    /** cartItemId — không phải productId */
    CartResponse updateItem(String email, Long cartItemId, int quantity);
    /** cartItemId — không phải productId */
    void removeItem(String email, Long cartItemId);
    void clearCart(String email);
}