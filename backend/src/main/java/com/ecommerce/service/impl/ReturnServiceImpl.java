package com.ecommerce.service.impl;

import com.ecommerce.dto.request.AdminUpdateReturnRequest;
import com.ecommerce.dto.request.CreateReturnRequest;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.ReturnResponse;
import com.ecommerce.entity.*;
import com.ecommerce.enums.OrderStatus;
import com.ecommerce.enums.ReturnReason;
import com.ecommerce.enums.ReturnStatus;
import com.ecommerce.exception.BusinessException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ReturnRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.EmailService;
import com.ecommerce.service.ReturnService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class ReturnServiceImpl implements ReturnService {

    private final ReturnRepository returnRepository;
    private final OrderRepository  orderRepository;
    private final UserRepository   userRepository;
    private final EmailService     emailService;

    // ── Label maps ────────────────────────────────────────────────
    private static final Map<String, String> STATUS_LABELS = Map.of(
        "PENDING",    "Chờ duyệt",
        "APPROVED",   "Đã duyệt",
        "RECEIVED",   "Đã nhận hàng",
        "INSPECTING", "Đang kiểm tra",
        "REFUNDING",  "Đang hoàn tiền",
        "COMPLETED",  "Hoàn tất",
        "REJECTED",   "Từ chối"
    );

    private static final Map<String, String> REASON_LABELS = Map.of(
        "WRONG_ITEM",       "Sai sản phẩm / màu / size",
        "DEFECTIVE",        "Hàng lỗi / hư hỏng",
        "NOT_AS_DESCRIBED", "Không đúng mô tả",
        "CHANGED_MIND",     "Đổi ý không muốn mua",
        "MISSING_PARTS",    "Thiếu phụ kiện",
        "OTHER",            "Lý do khác"
    );

    // ── CREATE ────────────────────────────────────────────────────

    @Override
    @Transactional
    public ReturnResponse create(String email, CreateReturnRequest req) {
        User user = findUser(email);

        // 1. Verify order tồn tại, DELIVERED và thuộc về user
        Order order = orderRepository.findById(req.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new BusinessException("Đơn hàng không thuộc về tài khoản của bạn");
        }
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new BusinessException(
                    "Chỉ có thể hoàn hàng cho đơn hàng đã giao thành công");
        }

        // 2. Kiểm tra đã có return request cho order này chưa
        if (returnRepository.existsByOrderIdAndUserId(order.getId(), user.getId())) {
            throw new BusinessException(
                    "Bạn đã tạo yêu cầu hoàn hàng cho đơn hàng này rồi");
        }

        // 3. Validate enum reason
        ReturnReason reason;
        try {
            reason = ReturnReason.valueOf(req.getReason().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Lý do hoàn hàng không hợp lệ: " + req.getReason());
        }

        // 4. Build ReturnItems từ danh sách orderItemId + quantity
        Map<Long, OrderItem> orderItemMap = new java.util.HashMap<>();
        order.getOrderItems().forEach(oi -> orderItemMap.put(oi.getId(), oi));

        List<ReturnItem> returnItems = req.getItems().stream().map(itemReq -> {
            OrderItem oi = orderItemMap.get(itemReq.getOrderItemId());
            if (oi == null) {
                throw new BusinessException(
                        "Sản phẩm không thuộc đơn hàng này: ID " + itemReq.getOrderItemId());
            }
            if (itemReq.getQuantity() > oi.getQuantity()) {
                throw new BusinessException(
                        "Số lượng hoàn vượt quá số lượng đã đặt cho: " + oi.getProductName());
            }

            BigDecimal subtotal = oi.getUnitPrice()
                    .multiply(BigDecimal.valueOf(itemReq.getQuantity()));

            return ReturnItem.builder()
                    .orderItemId(oi.getId())
                    .productName(oi.getProductName())
                    .productImg(oi.getProductImg())
                    .variantName(oi.getVariantName())
                    .sku(oi.getSku())
                    .unitPrice(oi.getUnitPrice())
                    .quantity(itemReq.getQuantity())
                    .subtotal(subtotal)
                    .build();
        }).toList();

        // 5. Tạo ReturnRequest
        ReturnRequest returnRequest = ReturnRequest.builder()
                .returnCode(generateCode())
                .user(user)
                .order(order)
                .status(ReturnStatus.PENDING)
                .reason(reason)
                .description(req.getDescription())
                .build();

        // Gán FK trước khi persist
        returnItems.forEach(item -> item.setReturnRequest(returnRequest));
        returnRequest.setReturnItems(returnItems);

        ReturnRequest saved = returnRepository.save(returnRequest);

        // 6. Gửi email thông báo cho khách
        emailService.sendReturnRequestConfirmation(saved);

        return toResponse(saved);
    }

    // ── GET MY ───────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReturnResponse> getMyReturns(String email, Pageable pageable) {
        User user = findUser(email);
        return PageResponse.of(
                returnRepository
                        .findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
                        .map(this::toResponse)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public ReturnResponse getById(String email, Long id) {
        User user = findUser(email);
        ReturnRequest rr = returnRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy yêu cầu hoàn hàng"));
        if (!rr.getUser().getId().equals(user.getId())) {
            throw new BusinessException("Bạn không có quyền xem yêu cầu này");
        }
        return toResponse(rr);
    }

    // ── ADMIN ────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReturnResponse> adminList(
            String status, String keyword, Pageable pageable) {
        ReturnStatus rs = (status != null && !status.isBlank())
                ? ReturnStatus.valueOf(status.toUpperCase()) : null;
        return PageResponse.of(
                returnRepository.searchAdmin(rs, keyword, pageable)
                        .map(this::toResponse)
        );
    }

    @Override
    @Transactional
    public ReturnResponse adminUpdate(Long id, AdminUpdateReturnRequest req) {
        ReturnRequest rr = returnRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy yêu cầu ID: " + id));

        if (req.getStatus() != null) {
            ReturnStatus newStatus;
            try {
                newStatus = ReturnStatus.valueOf(req.getStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BusinessException("Trạng thái không hợp lệ: " + req.getStatus());
            }

            // Validate REJECTED phải có rejectReason
            if (newStatus == ReturnStatus.REJECTED
                    && (req.getRejectReason() == null || req.getRejectReason().isBlank())) {
                throw new BusinessException("Vui lòng nhập lý do từ chối");
            }

            rr.setStatus(newStatus);

            if (newStatus == ReturnStatus.COMPLETED) {
                rr.setCompletedAt(LocalDateTime.now());
            }
            if (newStatus == ReturnStatus.REJECTED) {
                rr.setRejectedAt(LocalDateTime.now());
                rr.setRejectReason(req.getRejectReason());
            }
        }

        if (req.getAdminNote()    != null) rr.setAdminNote(req.getAdminNote());
        if (req.getRefundAmount() != null) rr.setRefundAmount(req.getRefundAmount());
        if (req.getRefundMethod() != null) rr.setRefundMethod(req.getRefundMethod());

        ReturnRequest saved = returnRepository.save(rr);

        // Notify khách khi có thay đổi quan trọng
        emailService.sendReturnStatusUpdate(saved);

        return toResponse(saved);
    }

    // ── Private helpers ───────────────────────────────────────────

    private ReturnResponse toResponse(ReturnRequest rr) {
        List<ReturnResponse.ReturnItemResponse> itemResponses =
                rr.getReturnItems().stream()
                        .map(item -> ReturnResponse.ReturnItemResponse.builder()
                                .orderItemId(item.getOrderItemId())
                                .productName(item.getProductName())
                                .productImg(item.getProductImg())
                                .variantName(item.getVariantName())
                                .sku(item.getSku())
                                .unitPrice(item.getUnitPrice())
                                .quantity(item.getQuantity())
                                .subtotal(item.getSubtotal())
                                .build())
                        .toList();

        return ReturnResponse.builder()
                .id(rr.getId())
                .returnCode(rr.getReturnCode())
                .userId(rr.getUser().getId())
                .userName(rr.getUser().getFullName())
                .userEmail(rr.getUser().getEmail())
                .orderId(rr.getOrder().getId())
                .orderCode(rr.getOrder().getOrderCode())
                .status(rr.getStatus().name())
                .statusLabel(STATUS_LABELS.getOrDefault(
                        rr.getStatus().name(), rr.getStatus().name()))
                .reason(rr.getReason().name())
                .reasonLabel(REASON_LABELS.getOrDefault(
                        rr.getReason().name(), rr.getReason().name()))
                .description(rr.getDescription())
                .adminNote(rr.getAdminNote())
                .rejectReason(rr.getRejectReason())
                .refundAmount(rr.getRefundAmount())
                .refundMethod(rr.getRefundMethod())
                .items(itemResponses)
                .completedAt(rr.getCompletedAt())
                .rejectedAt(rr.getRejectedAt())
                .createdAt(rr.getCreatedAt())
                .updatedAt(rr.getUpdatedAt())
                .build();
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy user: " + email));
    }

    private String generateCode() {
        String date   = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String random = String.format("%04d", new Random().nextInt(10000));
        return "RET-" + date + "-" + random;
    }
}
