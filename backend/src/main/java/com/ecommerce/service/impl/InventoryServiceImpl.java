package com.ecommerce.service.impl;

import com.ecommerce.dto.request.StockRequest;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.StockTransactionResponse;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.StockTransaction;
import com.ecommerce.enums.StockTransactionType;
import com.ecommerce.exception.BusinessException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.StockTransactionRepository;
import com.ecommerce.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final StockTransactionRepository stockRepo;
    private final ProductRepository          productRepository;

    @Override
    @Transactional
    public StockTransactionResponse addTransaction(String adminEmail, StockRequest req) {
        Product product = productRepository.findById(req.getProductId())
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm ID: " + req.getProductId()));

        StockTransactionType type = StockTransactionType.valueOf(req.getType().toUpperCase());
        int currentStock = product.getStockQty();
        int newStock;

        switch (type) {
            case IMPORT -> newStock = currentStock + req.getQuantity();
            case EXPORT -> {
                if (req.getQuantity() > currentStock)
                    throw new BusinessException("Số lượng xuất vượt quá tồn kho (" + currentStock + ")");
                newStock = currentStock - req.getQuantity();
            }
            case ADJUST -> newStock = req.getQuantity();
            default -> throw new BusinessException("Loại giao dịch không hợp lệ");
        }

        product.setStockQty(newStock);
        productRepository.save(product);

        StockTransaction tx = StockTransaction.builder()
            .product(product)
            .type(type)
            .quantity(req.getQuantity())
            .stockAfter(newStock)
            .unitCost(req.getUnitCost())
            .supplier(req.getSupplier())
            .note(req.getNote())
            .createdBy(adminEmail)
            .build();

        return toResponse(stockRepo.save(tx));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StockTransactionResponse> listAll(String keyword, Pageable pageable) {
        return PageResponse.of(stockRepo.searchAll(keyword, pageable).map(this::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StockTransactionResponse> listByProduct(Long productId, Pageable pageable) {
        return PageResponse.of(
            stockRepo.findByProductIdOrderByCreatedAtDesc(productId, pageable).map(this::toResponse));
    }

    private StockTransactionResponse toResponse(StockTransaction t) {
        return StockTransactionResponse.builder()
            .id(t.getId())
            .productId(t.getProduct().getId())
            .productName(t.getProduct().getName())
            .productSku(t.getProduct().getSku())
            .productImage(t.getProduct().getImageUrl())
            .type(t.getType().name())
            .quantity(t.getQuantity())
            .stockAfter(t.getStockAfter())
            .unitCost(t.getUnitCost())
            .supplier(t.getSupplier())
            .note(t.getNote())
            .createdBy(t.getCreatedBy())
            .createdAt(t.getCreatedAt())
            .build();
    }
}