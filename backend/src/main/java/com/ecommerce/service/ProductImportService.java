package com.ecommerce.service;

import com.ecommerce.dto.response.ImportResultResponse;
import org.springframework.web.multipart.MultipartFile;

public interface ProductImportService {

    /**
     * @param dryRun true = chỉ validate, không ghi DB (dùng cho bước xem trước / preview)
     */
    ImportResultResponse importFromExcel(MultipartFile file, boolean dryRun);

    /** Sinh file Excel mẫu (kèm danh sách danh mục hiện có) để admin tải về điền. */
    byte[] generateTemplate();
}
