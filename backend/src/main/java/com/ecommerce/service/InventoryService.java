package com.ecommerce.service;

import com.ecommerce.dto.request.StockRequest;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.StockTransactionResponse;
import org.springframework.data.domain.Pageable;

public interface InventoryService {

    StockTransactionResponse addTransaction(String adminEmail, StockRequest request);

    PageResponse<StockTransactionResponse> listAll(String keyword, Pageable pageable);

    PageResponse<StockTransactionResponse> listByProduct(Long productId, Pageable pageable);
}
