package com.ecommerce.service.impl;

import com.ecommerce.dto.request.CreateWarrantyRequest;
import com.ecommerce.dto.request.UpdateWarrantyRequest;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.WarrantyResponse;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.User;
import com.ecommerce.entity.WarrantyRequest;
import com.ecommerce.enums.OrderStatus;
import com.ecommerce.enums.WarrantyStatus;
import com.ecommerce.enums.WarrantyType;
import com.ecommerce.exception.BusinessException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.repository.WarrantyRepository;
import com.ecommerce.service.WarrantyService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class WarrantyServiceImpl implements WarrantyService {

    private final WarrantyRepository warrantyRepository;
    private final UserRepository     userRepository;
    private final OrderRepository    orderRepository;

    // ── Label maps ────────────────────────────────────────────────
    private static final Map<String, String> TYPE_LABELS = Map.of(
        "WARRANTY", "Bảo hành",
        "REPAIR",   "Sửa chữa",
        "EXCHANGE", "Đổi hàng",
        "RETURN",   "Trả hàng"
    );

    private static final Map<String, String> STATUS_LABELS = Map.of(
        "PENDING",      "Chờ tiếp nhận",
        "RECEIVED",     "Đã tiếp nhận",
        "DIAGNOSING",   "Đang kiểm tra",
        "REPAIRING",    "Đang sửa chữa",
        "WAITING_PART", "Chờ linh kiện",
        "DONE",         "Hoàn thành",
        "RETURNED",     "Đã trả khách",
        "REJECTED",     "Từ chối"
    );

    // ── Customer: CREATE ──────────────────────────────────────────

    @Override
    @Transactional
    public WarrantyResponse create(String email, CreateWarrantyRequest req) {
        User user = findUser(email);
        Order order = null;

        // [MỚI] Ưu tiên orderId nếu có (flow từ OrderDetailPage)
        if (req.getOrderId() != null) {
            order = orderRepository.findById(req.getOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Không tìm thấy đơn hàng"));

            // Verify order thuộc về user
            if (!order.getUser().getId().equals(user.getId())) {
                throw new BusinessException("Đơn hàng không thuộc về tài khoản của bạn");
            }

            // Verify order đã DELIVERED
            if (order.getStatus() != OrderStatus.DELIVERED) {
                throw new BusinessException(
                        "Chỉ có thể tạo yêu cầu bảo hành cho đơn hàng đã giao thành công");
            }

            // Kiểm tra đã tạo warranty cho order này chưa
            if (warrantyRepository.existsByOrderIdAndUserId(order.getId(), user.getId())) {
                throw new BusinessException(
                        "Bạn đã tạo yêu cầu bảo hành cho đơn hàng này rồi");
            }

        } else if (req.getOrderCode() != null && !req.getOrderCode().isBlank()) {
            // Flow cũ: tìm theo orderCode nhập tay (không bắt buộc DELIVERED)
            order = orderRepository.findByOrderCode(req.getOrderCode().trim()).orElse(null);
        }

        // Pre-fill productName từ order nếu không nhập tay
        String productName = req.getProductName();
        if ((productName == null || productName.isBlank()) && order != null) {
            productName = order.getOrderItems().stream()
                    .map(item -> item.getProductName())
                    .findFirst()
                    .orElse("Sản phẩm từ đơn " + order.getOrderCode());
        }

        WarrantyRequest entity = WarrantyRequest.builder()
                .requestCode(generateCode())
                .user(user)
                .order(order)
                .productName(productName)
                .serialNumber(req.getSerialNumber())
                .type(WarrantyType.valueOf(req.getType().toUpperCase()))
                .description(req.getDescription())
                .status(WarrantyStatus.PENDING)
                .build();

        return toResponse(warrantyRepository.save(entity));
    }

    // ── Customer: GET MY ──────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageResponse<WarrantyResponse> getMyRequests(String email, Pageable pageable) {
        User user = findUser(email);
        return PageResponse.of(
                warrantyRepository
                        .findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
                        .map(this::toResponse)
        );
    }

    // ── Customer: LOOKUP (public) ─────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public WarrantyResponse lookup(String requestCode) {
        return toResponse(
                warrantyRepository.findByRequestCode(requestCode)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Không tìm thấy yêu cầu: " + requestCode))
        );
    }

    // ── Admin ─────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageResponse<WarrantyResponse> adminList(
            String status, String keyword, Pageable pageable) {
        WarrantyStatus ws = (status != null && !status.isBlank())
                ? WarrantyStatus.valueOf(status.toUpperCase()) : null;
        return PageResponse.of(
                warrantyRepository.searchAdmin(ws, keyword, pageable)
                        .map(this::toResponse)
        );
    }

    @Override
    @Transactional
    public WarrantyResponse adminUpdate(Long id, UpdateWarrantyRequest req) {
        WarrantyRequest entity = warrantyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy yêu cầu ID: " + id));

        if (req.getStatus() != null) {
            WarrantyStatus newStatus =
                    WarrantyStatus.valueOf(req.getStatus().toUpperCase());
            entity.setStatus(newStatus);
            // Đánh dấu thời gian hoàn thành
            if (newStatus == WarrantyStatus.RETURNED
                    || newStatus == WarrantyStatus.REJECTED) {
                entity.setResolvedAt(LocalDateTime.now());
            }
        }
        if (req.getAdminNote() != null)
            entity.setAdminNote(req.getAdminNote());
        if (req.getEstimatedReturnDate() != null)
            entity.setEstimatedReturnDate(req.getEstimatedReturnDate());

        return toResponse(warrantyRepository.save(entity));
    }

    // ── Private helpers ───────────────────────────────────────────

    private WarrantyResponse toResponse(WarrantyRequest w) {
        // Snapshot tên các sản phẩm trong đơn (hiển thị ở UI)
        List<String> itemNames = null;
        if (w.getOrder() != null && w.getOrder().getOrderItems() != null) {
            itemNames = w.getOrder().getOrderItems().stream()
                    .map(item -> item.getProductName()
                            + (item.getVariantName() != null
                                ? " - " + item.getVariantName() : ""))
                    .toList();
        }

        return WarrantyResponse.builder()
                .id(w.getId())
                .requestCode(w.getRequestCode())
                .userId(w.getUser().getId())
                .userName(w.getUser().getFullName())
                .userEmail(w.getUser().getEmail())
                .userPhone(w.getUser().getPhone())
                .orderId(w.getOrder()  != null ? w.getOrder().getId()        : null)
                .orderCode(w.getOrder()!= null ? w.getOrder().getOrderCode() : null)
                .productName(w.getProductName())
                .serialNumber(w.getSerialNumber())
                .orderItemNames(itemNames)
                .type(w.getType().name())
                .typeLabel(TYPE_LABELS.getOrDefault(
                        w.getType().name(), w.getType().name()))
                .status(w.getStatus().name())
                .statusLabel(STATUS_LABELS.getOrDefault(
                        w.getStatus().name(), w.getStatus().name()))
                .description(w.getDescription())
                .adminNote(w.getAdminNote())
                .estimatedReturnDate(w.getEstimatedReturnDate())
                .resolvedAt(w.getResolvedAt())
                .createdAt(w.getCreatedAt())
                .updatedAt(w.getUpdatedAt())
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
        return "WR-" + date + "-" + random;
    }
}