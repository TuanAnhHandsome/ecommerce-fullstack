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
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final PaymentRepository paymentRepository;
    private final CouponRepository couponRepository;
    private final EmailService emailService;
    private final CouponService couponService;

    @Override
    @Transactional
    public OrderResponse createOrder(String email, CreateOrderRequest req) {
        User user = findUser(email);

        List<CartItem> cartItems = cartItemRepository.findByUserOrderByCreatedAtDesc(user);
        if (cartItems.isEmpty())
            throw new BusinessException("Giỏ hàng trống");

        // Build order items + validate stock
        List<OrderItem> orderItems = cartItems.stream().map(ci -> {
            Product product = ci.getProduct();
            if (!product.getActive())
                throw new BusinessException("Sản phẩm '" + product.getName() + "' không còn bán");
            if (product.getStockQty() < ci.getQuantity())
                throw new BusinessException("Sản phẩm '" + product.getName() + "' không đủ hàng");

            product.setStockQty(product.getStockQty() - ci.getQuantity());
            productRepository.save(product);

            BigDecimal unitPrice = product.getEffectivePrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(ci.getQuantity()));
            return OrderItem.builder()
                    .productName(product.getName())
                    .productImg(product.getImageUrl())
                    .product(product)
                    .unitPrice(unitPrice)
                    .quantity(ci.getQuantity())
                    .subtotal(subtotal)
                    .build();
        }).collect(Collectors.toList());

        BigDecimal total = orderItems.stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // ── Áp dụng coupon ───────────────────────────────────────
        BigDecimal discountAmount = BigDecimal.ZERO;
        String appliedCouponCode = null;

        if (req.getCouponCode() != null && !req.getCouponCode().isBlank()) {
            // apply() ném BusinessException nếu không hợp lệ
            var couponResp = couponService.apply(req.getCouponCode(), total, user.getId());
            discountAmount = couponResp.getDiscountAmount();
            appliedCouponCode = couponResp.getCode();

            // Tăng usedCount
            couponRepository.findByCodeIgnoreCase(appliedCouponCode).ifPresent(c -> {
                c.setUsedCount(c.getUsedCount() + 1);
                couponRepository.save(c);
            });
        }
        // ─────────────────────────────────────────────────────────

        BigDecimal totalAfterDiscount = total.subtract(discountAmount).max(BigDecimal.ZERO);
        BigDecimal shippingFee = totalAfterDiscount.compareTo(BigDecimal.valueOf(500_000)) >= 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(30_000);
        BigDecimal finalAmount = totalAfterDiscount.add(shippingFee);

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

        if ("COD".equalsIgnoreCase(req.getPaymentGateway())) {
            paymentRepository.save(Payment.builder()
                    .order(saved)
                    .gateway(PaymentGateway.COD)
                    .amount(finalAmount)
                    .status(PaymentStatus.PENDING)
                    .build());
            saved.setStatus(OrderStatus.PROCESSING);
            orderRepository.save(saved);
        }

        cartItemRepository.deleteAllByUserId(user.getId());
        emailService.sendOrderConfirmation(saved);

        return toResponse(saved);
    }

    @Override
    public Order getOrderEntityForPayment(String email, Long orderId) {
        User user = findUser(email);
        Order order = orderRepository.findByIdAndUser(orderId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        if (order.getStatus() != OrderStatus.AWAITING_PAYMENT)
            throw new BusinessException("Đơn hàng không ở trạng thái chờ thanh toán");
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
        return PageResponse.of(orderRepository.findByUser(user, pageable).map(this::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getAllOrders(Pageable pageable, String statusStr) {
        if (statusStr != null && !statusStr.isBlank()) {
            OrderStatus status = OrderStatus.valueOf(statusStr.toUpperCase());
            return PageResponse.of(orderRepository.findByStatus(status, pageable).map(this::toResponse));
        }
        return PageResponse.of(orderRepository.findAll(pageable).map(this::toResponse));
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long id, String statusStr) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        order.setStatus(OrderStatus.valueOf(statusStr.toUpperCase()));
        Order saved = orderRepository.save(order);
        if (shouldNotifyCustomer(saved.getStatus()))
            emailService.sendOrderStatusUpdate(saved);
        return toResponse(saved);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
    }

    private String generateOrderCode() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String random = String.format("%04d", new Random().nextInt(10000));
        return "ORD-" + date + "-" + random;
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
                        .productId(i.getProduct() != null ? i.getProduct().getId() : null)
                        .productName(i.getProductName())
                        .productImg(i.getProductImg())
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
                .orderItems(items)
                .payment(paymentInfo)
                .createdAt(order.getCreatedAt())
                .build();
    }
}
