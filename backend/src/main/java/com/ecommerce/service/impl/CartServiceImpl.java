package com.ecommerce.service.impl;

import com.ecommerce.dto.request.CartItemRequest;
import com.ecommerce.dto.response.CartResponse;
import com.ecommerce.entity.CartItem;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.User;
import com.ecommerce.exception.BusinessException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.CartItemRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Override
    public CartResponse getCart(String email) {
        User user = findUser(email);
        List<CartItem> items = cartItemRepository.findByUserOrderByCreatedAtDesc(user);
        return buildCartResponse(items);
    }

    @Override
    @Transactional
    public CartResponse addItem(String email, CartItemRequest request) {
        User user = findUser(email);
        Product product = productRepository.findById(request.getProductId())
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));

        if (!product.getActive()) {
            throw new BusinessException("Sản phẩm không còn bán");
        }
        if (product.getStockQty() < request.getQuantity()) {
            throw new BusinessException("Sản phẩm chỉ còn " + product.getStockQty() + " cái");
        }

        // Nếu đã có trong giỏ → tăng số lượng
        cartItemRepository.findByUserIdAndProductId(user.getId(), product.getId())
            .ifPresentOrElse(
                existing -> {
                    int newQty = existing.getQuantity() + request.getQuantity();
                    if (newQty > product.getStockQty()) {
                        throw new BusinessException("Vượt quá số lượng tồn kho");
                    }
                    existing.setQuantity(newQty);
                    cartItemRepository.save(existing);
                },
                () -> cartItemRepository.save(
                    CartItem.builder()
                        .user(user)
                        .product(product)
                        .quantity(request.getQuantity())
                        .build()
                )
            );

        return getCart(email);
    }

    @Override
    @Transactional
    public CartResponse updateItem(String email, Long productId, int quantity) {
        User user = findUser(email);
        CartItem item = cartItemRepository.findByUserIdAndProductId(user.getId(), productId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm trong giỏ"));

        if (quantity <= 0) {
            cartItemRepository.delete(item);
        } else {
            if (quantity > item.getProduct().getStockQty()) {
                throw new BusinessException("Vượt quá số lượng tồn kho");
            }
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }

        return getCart(email);
    }

    @Override
    @Transactional
    public void removeItem(String email, Long productId) {
        User user = findUser(email);
        cartItemRepository.findByUserIdAndProductId(user.getId(), productId)
            .ifPresent(cartItemRepository::delete);
    }

    @Override
    @Transactional
    public void clearCart(String email) {
        User user = findUser(email);
        cartItemRepository.deleteAllByUserId(user.getId());
    }

    // ── Private helpers ──────────────────────────────────────────

    private User findUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
    }

    private CartResponse buildCartResponse(List<CartItem> items) {
        List<CartResponse.CartItemResponse> itemResponses = items.stream()
            .map(item -> CartResponse.CartItemResponse.builder()
                .productId(item.getProduct().getId())
                .productName(item.getProduct().getName())
                .productImage(item.getProduct().getImageUrl())
                .unitPrice(item.getProduct().getEffectivePrice())
                .quantity(item.getQuantity())
                .subtotal(item.getProduct().getEffectivePrice()
                    .multiply(BigDecimal.valueOf(item.getQuantity())))
                .maxStock(item.getProduct().getStockQty())
                .build()
            ).collect(Collectors.toList());

        BigDecimal total = itemResponses.stream()
            .map(CartResponse.CartItemResponse::getSubtotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponse.builder()
            .items(itemResponses)
            .totalItems(itemResponses.stream().mapToInt(CartResponse.CartItemResponse::getQuantity).sum())
            .totalAmount(total)
            .build();
    }
}
