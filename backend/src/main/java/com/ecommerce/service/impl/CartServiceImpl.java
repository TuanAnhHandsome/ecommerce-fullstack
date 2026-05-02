package com.ecommerce.service.impl;

import com.ecommerce.dto.request.CartItemRequest;
import com.ecommerce.dto.response.CartResponse;
import com.ecommerce.entity.CartItem;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.ProductVariant;
import com.ecommerce.entity.User;
import com.ecommerce.entity.VariantValue;
import com.ecommerce.exception.BusinessException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.CartItemRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ProductVariantRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;

    // ─────────────────────────────────────────────────────────────
    // GET — @Transactional giữ session mở để lazy load hoạt động
    // ─────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public CartResponse getCart(String email) {
        User user = findUser(email);
        List<CartItem> items = cartItemRepository.findByUserOrderByCreatedAtDesc(user);
        return buildCartResponse(items);
    }

    // ─────────────────────────────────────────────────────────────
    // ADD
    // ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public CartResponse addItem(String email, CartItemRequest request) {
        User user = findUser(email);

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));

        if (!product.getActive()) {
            throw new BusinessException("Sản phẩm không còn được bán");
        }

        // ── Resolve variant ──────────────────────────────────────
        ProductVariant variant = null;
        if (request.getVariantId() != null) {
            variant = productVariantRepository.findById(request.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy variant"));

            if (!variant.getProduct().getId().equals(product.getId())) {
                throw new BusinessException("Variant không thuộc sản phẩm này");
            }
            if (!variant.getActive()) {
                throw new BusinessException("Variant này hiện không còn bán");
            }
        }

        // ── Stock check ──────────────────────────────────────────
        int availableStock = variant != null ? variant.getStockQty() : product.getStockQty();
        if (availableStock < request.getQuantity()) {
            throw new BusinessException("Sản phẩm chỉ còn " + availableStock + " cái");
        }

        // ── Upsert: nếu đã có cùng product+variant → tăng qty ───
        final ProductVariant finalVariant = variant;
        cartItemRepository
                .findByUserIdAndProductIdAndVariantId(
                        user.getId(), product.getId(),
                        variant != null ? variant.getId() : null)
                .ifPresentOrElse(
                        existing -> {
                            int newQty = existing.getQuantity() + request.getQuantity();
                            if (newQty > availableStock) {
                                throw new BusinessException(
                                        "Giỏ hàng đã có " + existing.getQuantity()
                                        + " cái, tồn kho chỉ còn " + availableStock + " cái");
                            }
                            existing.setQuantity(newQty);
                            cartItemRepository.save(existing);
                        },
                        () -> cartItemRepository.save(
                                CartItem.builder()
                                        .user(user)
                                        .product(product)
                                        .variant(finalVariant)
                                        .quantity(request.getQuantity())
                                        .build()
                        )
                );

        return getCart(email);
    }

    // ─────────────────────────────────────────────────────────────
    // UPDATE
    // ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public CartResponse updateItem(String email, Long cartItemId, int quantity) {
        User user = findUser(email);
        CartItem item = findCartItemAndVerifyOwner(cartItemId, user);

        if (quantity <= 0) {
            cartItemRepository.delete(item);
        } else {
            int stock = item.getAvailableStock();
            if (quantity > stock) {
                throw new BusinessException("Vượt quá số lượng tồn kho (còn " + stock + " cái)");
            }
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }

        return getCart(email);
    }

    // ─────────────────────────────────────────────────────────────
    // REMOVE
    // ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void removeItem(String email, Long cartItemId) {
        User user = findUser(email);
        CartItem item = findCartItemAndVerifyOwner(cartItemId, user);
        cartItemRepository.delete(item);
    }

    // ─────────────────────────────────────────────────────────────
    // CLEAR
    // ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void clearCart(String email) {
        User user = findUser(email);
        cartItemRepository.deleteAllByUserId(user.getId());
    }

    // ─────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
    }

    private CartItem findCartItemAndVerifyOwner(Long cartItemId, User user) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm trong giỏ"));
        if (!item.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Không tìm thấy sản phẩm trong giỏ");
        }
        return item;
    }

    /**
     * Build CartResponse.
     * Gọi trong @Transactional nên session vẫn mở → lazy load hoạt động.
     */
    private CartResponse buildCartResponse(List<CartItem> items) {
        List<CartResponse.CartItemResponse> itemResponses = items.stream()
                .map(item -> {
                    ProductVariant variant = item.getVariant(); // lazy load OK vì trong @Transactional
                    Product product = item.getProduct();

                    // Variant values map: { "Màu sắc": "Đỏ", "Size": "XL" }
                    Map<String, String> variantValuesMap = null;
                    if (variant != null && variant.getVariantValues() != null) {
                        variantValuesMap = variant.getVariantValues().stream()
                                .collect(Collectors.toMap(
                                        vv -> vv.getVariantOption().getName(),
                                        VariantValue::getValue,
                                        (a, b) -> a,
                                        LinkedHashMap::new
                                ));
                    }

                    BigDecimal unitPrice = item.getEffectivePrice();
                    BigDecimal originalPrice = variant != null ? variant.getPrice() : product.getPrice();
                    if (unitPrice.compareTo(originalPrice) >= 0) {
                        originalPrice = null;
                    }

                    String image = null;
                    if (variant != null && variant.getImages() != null && !variant.getImages().isEmpty()) {
                        image = variant.getImages().get(0).getImageUrl();
                    }
                    if (image == null) {
                        image = product.getImageUrl();
                    }

                    BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));

                    return CartResponse.CartItemResponse.builder()
                            .id(item.getId())
                            .productId(product.getId())
                            .productName(product.getName())
                            .productSlug(product.getSlug())
                            .productImage(image)
                            .variantId(variant != null ? variant.getId() : null)
                            .sku(variant != null ? variant.getSku() : null)
                            .variantValues(variantValuesMap)
                            .unitPrice(unitPrice)
                            .originalPrice(originalPrice)
                            .quantity(item.getQuantity())
                            .subtotal(subtotal)
                            .maxStock(item.getAvailableStock())
                            .build();
                })
                .collect(Collectors.toList());

        BigDecimal total = itemResponses.stream()
                .map(CartResponse.CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponse.builder()
                .items(itemResponses)
                .totalItems(itemResponses.stream()
                        .mapToInt(CartResponse.CartItemResponse::getQuantity)
                        .sum())
                .totalAmount(total)
                .build();
    }
}