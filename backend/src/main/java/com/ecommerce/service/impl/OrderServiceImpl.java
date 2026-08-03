package com.ecommerce.service.impl;

import com.ecommerce.dto.request.CreateOrderRequest;
import com.ecommerce.dto.response.OrderResponse;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.entity.*;
import com.ecommerce.enums.OrderStatus;
import com.ecommerce.enums.PaymentGateway;
import com.ecommerce.enums.PaymentStatus;
import com.ecommerce.exception.BusinessException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.*;
import com.ecommerce.service.CouponService;
import com.ecommerce.service.EmailService;
import com.ecommerce.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final PaymentRepository paymentRepository;
    private final CouponRepository couponRepository;
    private final EmailService emailService;
    private final CouponService couponService;

    // ─────────────────────────────────────────────────────────────
    // CREATE ORDER
    // ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public OrderResponse createOrder(String email, CreateOrderRequest req) {
        User user = findUser(email);

        // ── 1. Lấy đúng CartItem theo cartItemIds, verify ownership ──
        List<CartItem> cartItems = cartItemRepository.findAllById(req.getCartItemIds());

        if (cartItems.isEmpty()) {
            throw new BusinessException("Không tìm thấy sản phẩm trong giỏ hàng");
        }

        // Verify tất cả item đều thuộc về user này
        boolean hasUnauthorized = cartItems.stream()
                .anyMatch(ci -> !ci.getUser().getId().equals(user.getId()));
        if (hasUnauthorized) {
            throw new BusinessException("Yêu cầu không hợp lệ");
        }

        // Verify đủ số lượng item được chọn
        if (cartItems.size() != req.getCartItemIds().size()) {
            throw new BusinessException("Một số sản phẩm không còn trong giỏ hàng");
        }

        // ── 2. Build OrderItems + validate stock + trừ stock ────────
        List<OrderItem> orderItems = cartItems.stream().map(ci -> {
            Product product = ci.getProduct();
            ProductVariant variant = ci.getVariant();

            // Validate product
            if (!product.getActive()) {
                throw new BusinessException("Sản phẩm '" + product.getName() + "' không còn được bán");
            }

            // Validate & trừ stock đúng chỗ (variant hoặc product)
            if (variant != null) {
                if (!variant.getActive()) {
                    throw new BusinessException(
                            "Phiên bản '" + buildVariantName(variant) + "' của '"
                            + product.getName() + "' không còn bán");
                }
                if (variant.getStockQty() < ci.getQuantity()) {
                    throw new BusinessException(
                            "'" + product.getName() + " - " + buildVariantName(variant)
                            + "' chỉ còn " + variant.getStockQty() + " cái");
                }
                variant.setStockQty(variant.getStockQty() - ci.getQuantity());
                productVariantRepository.save(variant);
            } else {
                if (product.getStockQty() < ci.getQuantity()) {
                    throw new BusinessException(
                            "'" + product.getName() + "' chỉ còn " + product.getStockQty() + " cái");
                }
                product.setStockQty(product.getStockQty() - ci.getQuantity());
                productRepository.save(product);
            }

            // Giá hiệu lực tại thời điểm mua
            BigDecimal unitPrice = ci.getEffectivePrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(ci.getQuantity()));

            // Ảnh: ưu tiên ảnh variant, fallback product
            String img = null;
            if (variant != null && variant.getImages() != null && !variant.getImages().isEmpty()) {
                img = variant.getImages().get(0).getImageUrl();
            }
            if (img == null) img = product.getImageUrl();

            return OrderItem.builder()
                    .product(product)
                    .productName(product.getName())
                    .productImg(img)
                    // Snapshot variant tại thời điểm mua
                    .variantId(variant != null ? variant.getId() : null)
                    .variantName(variant != null ? buildVariantName(variant) : null)
                    .sku(variant != null ? variant.getSku() : product.getSku())
                    .unitPrice(unitPrice)
                    .quantity(ci.getQuantity())
                    .subtotal(subtotal)
                    .build();
        }).collect(Collectors.toList());

        // ── 3. Tính tổng tiền tại backend (không tin client) ────────
        BigDecimal total = orderItems.stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // ── 4. Áp dụng coupon ────────────────────────────────────────
        BigDecimal discountAmount = BigDecimal.ZERO;
        String appliedCouponCode = null;

        if (req.getCouponCode() != null && !req.getCouponCode().isBlank()) {
            var couponResp = couponService.apply(req.getCouponCode(), total, user.getId());
            discountAmount = couponResp.getDiscountAmount();
            appliedCouponCode = couponResp.getCode();

            couponRepository.findByCodeIgnoreCase(appliedCouponCode).ifPresent(c -> {
                c.setUsedCount(c.getUsedCount() + 1);
                couponRepository.save(c);
            });
        }

        // ── 5. Tính phí ship ─────────────────────────────────────────
        BigDecimal totalAfterDiscount = total.subtract(discountAmount).max(BigDecimal.ZERO);
        BigDecimal shippingFee = totalAfterDiscount.compareTo(BigDecimal.valueOf(500_000)) >= 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(30_000);
        BigDecimal finalAmount = totalAfterDiscount.add(shippingFee);

        // ── 6. Tạo Order ─────────────────────────────────────────────
        Order order = Order.builder()
                .user(user)
                .orderCode(generateOrderCode())
                .totalAmount(total)
                .shippingFee(shippingFee)
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .status(OrderStatus.AWAITING_PAYMENT)
                .shippingName(req.getShippingName())
                .shippingPhone(req.getShippingPhone())
                .shippingAddress(req.getShippingAddress())
                .note(req.getNote())
                .couponCode(appliedCouponCode)
                .build();

        orderItems.forEach(item -> item.setOrder(order));
        order.setOrderItems(orderItems);
        Order saved = orderRepository.save(order);

        // ── 7. COD: chuyển sang PROCESSING ngay ─────────────────────
        if ("COD".equalsIgnoreCase(req.getPaymentGateway())) {
            paymentRepository.save(Payment.builder()
                    .order(saved)
                    .gateway(PaymentGateway.COD)
                    .amount(finalAmount)
                    .currency("VND")
                    .status(PaymentStatus.PENDING)
                    .build());
            saved.setStatus(OrderStatus.PROCESSING);
            orderRepository.save(saved);
        }

        // ── 8. Xóa đúng các CartItem đã đặt (không xóa toàn bộ cart) ─
        cartItemRepository.deleteAll(cartItems);

        // ── 9. Gửi email xác nhận (chỉ COD — VNPay gửi sau khi paid) ─
        if ("COD".equalsIgnoreCase(req.getPaymentGateway())) {
            emailService.sendOrderConfirmation(saved);
        }

        return toResponse(saved);
    }

    // ─────────────────────────────────────────────────────────────
    // GET
    // ─────────────────────────────────────────────────────────────

    @Override
    public Order getOrderEntityForPayment(String email, Long orderId) {
        User user = findUser(email);
        Order order = orderRepository.findByIdAndUser(orderId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        if (order.getStatus() != OrderStatus.AWAITING_PAYMENT) {
            throw new BusinessException("Đơn hàng không ở trạng thái chờ thanh toán");
        }
        return order;
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(String email, Long id) {
        User user = findUser(email);
        return toResponse(orderRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng")));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getMyOrders(String email, Pageable pageable) {
        User user = findUser(email);
        return toPageResponse(orderRepository.findIdsByUser(user, pageable));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getAllOrders(Pageable pageable, String statusStr) {
        if (statusStr != null && !statusStr.isBlank()) {
            try {
                OrderStatus status = OrderStatus.valueOf(statusStr.toUpperCase());
                return toPageResponse(orderRepository.findIdsByStatus(status, pageable));
            } catch (IllegalArgumentException e) {
                throw new BusinessException("Trạng thái đơn hàng không hợp lệ: " + statusStr);
            }
        }
        return toPageResponse(orderRepository.findAllIds(pageable));
    }

    /**
     * Nhận 1 trang gồm CHỈ order id (query nhẹ, giữ đúng phân trang/sắp xếp),
     * rồi JOIN FETCH toàn bộ user + orderItems + payment cho đúng các id đó
     * trong một query duy nhất — tránh N+1 (xem ghi chú trong OrderRepository).
     */
    private PageResponse<OrderResponse> toPageResponse(Page<Long> idPage) {
        List<Long> ids = idPage.getContent();
        if (ids.isEmpty()) {
            return PageResponse.of(new PageImpl<OrderResponse>(List.of(), idPage.getPageable(), idPage.getTotalElements()));
        }

        Map<Long, Order> byId = orderRepository.findByIdInWithDetails(ids).stream()
                .collect(Collectors.toMap(Order::getId, o -> o));

        // Giữ đúng thứ tự phân trang ban đầu (idPage), không dựa vào thứ tự trả về của query IN
        List<OrderResponse> content = ids.stream()
                .map(byId::get)
                .filter(Objects::nonNull)
                .map(this::toResponse)
                .toList();

        return PageResponse.of(new PageImpl<>(content, idPage.getPageable(), idPage.getTotalElements()));
    }

    // ─────────────────────────────────────────────────────────────
    // ADMIN UPDATE STATUS
    // ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long id, String statusStr) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        try {
            order.setStatus(OrderStatus.valueOf(statusStr.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Trạng thái không hợp lệ: " + statusStr);
        }
        Order saved = orderRepository.save(order);
        if (shouldNotifyCustomer(saved.getStatus())) {
            emailService.sendOrderStatusUpdate(saved);
        }
        return toResponse(saved);
    }

    // ─────────────────────────────────────────────────────────────
    // CANCEL ORDER
    // ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public OrderResponse cancelOrder(String email, Long orderId, String reason) {
        User user = findUser(email);
        Order order = orderRepository.findByIdAndUser(orderId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));

        // Chỉ cho phép hủy khi chưa giao hàng
        if (order.getStatus() != OrderStatus.AWAITING_PAYMENT
                && order.getStatus() != OrderStatus.PROCESSING) {
            throw new BusinessException(
                    "Không thể hủy đơn hàng ở trạng thái: "
                    + order.getStatus().name());
        }

        // Hoàn trả stock đúng chỗ (variant hoặc product)
        for (OrderItem item : order.getOrderItems()) {
            if (item.getVariantId() != null) {
                productVariantRepository.findById(item.getVariantId()).ifPresent(v -> {
                    v.setStockQty(v.getStockQty() + item.getQuantity());
                    productVariantRepository.save(v);
                });
            } else if (item.getProduct() != null) {
                Product p = item.getProduct();
                p.setStockQty(p.getStockQty() + item.getQuantity());
                productRepository.save(p);
            }
        }

        // Hoàn coupon (giảm usedCount)
        if (order.getCouponCode() != null && !order.getCouponCode().isBlank()) {
            couponRepository.findByCodeIgnoreCase(order.getCouponCode()).ifPresent(c -> {
                if (c.getUsedCount() > 0) {
                    c.setUsedCount(c.getUsedCount() - 1);
                    couponRepository.save(c);
                }
            });
        }

        order.setCancelReason(reason);
        order.setCancelledAt(LocalDateTime.now());
        order.setCancelledBy(email);

        // Xác định status hủy dựa vào payment
        Payment payment = order.getPayment();
        if (payment != null && payment.getStatus() == PaymentStatus.SUCCESS) {
            payment.setStatus(PaymentStatus.REFUNDED);
            paymentRepository.save(payment);
            order.setStatus(OrderStatus.REFUNDED);
        } else {
            order.setStatus(OrderStatus.CANCELLED);
        }

        Order saved = orderRepository.save(order);
        emailService.sendOrderStatusUpdate(saved);
        return toResponse(saved);
    }

    // ─────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
    }

    /**
     * Tạo orderCode không trùng lặp.
     * Format: ORD-20250120-{8 ký tự UUID}
     */
    private String generateOrderCode() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String unique = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return "ORD-" + date + "-" + unique;
    }

    /**
     * Build tên variant từ danh sách VariantValue.
     * Ví dụ: "Màu: Đỏ / Size: XL"
     */
    private String buildVariantName(ProductVariant variant) {
        if (variant.getVariantValues() == null || variant.getVariantValues().isEmpty()) {
            return variant.getSku() != null ? variant.getSku() : "Variant #" + variant.getId();
        }
        return variant.getVariantValues().stream()
                .map(vv -> vv.getVariantOption().getName() + ": " + vv.getValue())
                .collect(Collectors.joining(" / "));
    }

    private boolean shouldNotifyCustomer(OrderStatus status) {
        return switch (status) {
            case PAID, SHIPPED, DELIVERED, CANCELLED, REFUNDED -> true;
            default -> false;
        };
    }

    private OrderResponse toResponse(Order order) {
        List<OrderResponse.OrderItemResponse> items = order.getOrderItems().stream()
                .map(i -> OrderResponse.OrderItemResponse.builder()
                        .id(i.getId())
                        .productId(i.getProduct() != null ? i.getProduct().getId() : null)
                        .productName(i.getProductName())
                        .productImg(i.getProductImg())
                        .variantId(i.getVariantId())
                        .variantName(i.getVariantName())
                        .sku(i.getSku())
                        .unitPrice(i.getUnitPrice())
                        .quantity(i.getQuantity())
                        .subtotal(i.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        OrderResponse.PaymentInfo paymentInfo = null;
        if (order.getPayment() != null) {
            Payment p = order.getPayment();
            paymentInfo = OrderResponse.PaymentInfo.builder()
                    .gateway(p.getGateway().name())
                    .status(p.getStatus().name())
                    .paidAt(p.getPaidAt())
                    .build();
        }

        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUser().getId())
                .userName(order.getUser().getFullName())
                .totalAmount(order.getTotalAmount())
                .shippingFee(order.getShippingFee())
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
                .status(order.getStatus().name())
                .shippingName(order.getShippingName())
                .shippingPhone(order.getShippingPhone())
                .shippingAddress(order.getShippingAddress())
                .note(order.getNote())
                .couponCode(order.getCouponCode())
                .orderItems(items)
                .payment(paymentInfo)
                .createdAt(order.getCreatedAt())
                .cancelReason(order.getCancelReason())
                .cancelledAt(order.getCancelledAt())
                .cancelledBy(order.getCancelledBy())
                .build();
    }
}