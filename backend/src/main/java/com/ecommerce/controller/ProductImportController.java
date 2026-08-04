package com.ecommerce.controller;

import com.ecommerce.dto.response.ImportResultResponse;
import com.ecommerce.service.ProductImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/products/import")
@RequiredArgsConstructor
public class ProductImportController {

    private final ProductImportService importService;

    /** Tải file Excel mẫu (kèm sẵn danh sách danh mục hiện có + dòng ví dụ). */
    @GetMapping("/template")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> downloadTemplate() {
        byte[] bytes = importService.generateTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=mau-import-san-pham.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    /** Xem trước kết quả — validate toàn bộ file nhưng KHÔNG ghi DB. */
    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ImportResultResponse> preview(@RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(importService.importFromExcel(file, true));
    }

    /** Import thật — ghi DB. Mỗi sản phẩm xử lý độc lập, lỗi 1 dòng không chặn các dòng khác. */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ImportResultResponse> importProducts(@RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(importService.importFromExcel(file, false));
    }
}
