package com.ecommerce.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockRequest {

    @NotNull(message = "ID sản phẩm không được để trống")
    private Long productId;

    @NotNull(message = "Loại giao dịch không được để trống")
    private String type;   // IMPORT | EXPORT | ADJUST

    @NotNull
    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer quantity;

    /** Giá nhập — chỉ có nghĩa với IMPORT */
    private BigDecimal unitCost;

    @Size(max = 255)
    private String supplier;

    @Size(max = 500)
    private String note;
}
