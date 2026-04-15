package com.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockTransactionResponse {

    private Long   id;
    private Long   productId;
    private String productName;
    private String productSku;
    private String productImage;

    /** "IMPORT" | "EXPORT" | "ADJUST" */
    private String  type;
    private Integer quantity;
    private Integer stockAfter;

    private BigDecimal unitCost;
    private String     supplier;
    private String     note;
    private String     createdBy;

    private LocalDateTime createdAt;
}
