package com.ecommerce.service.impl;

import com.ecommerce.dto.response.ImportResultResponse;
import com.ecommerce.dto.response.ImportResultResponse.ImportErrorItem;
import com.ecommerce.dto.response.ImportResultResponse.ImportedItem;
import com.ecommerce.entity.Category;
import com.ecommerce.exception.BusinessException;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.service.ProductImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Import hàng loạt sản phẩm từ file Excel (3 sheet: SanPham, BienThe, ThongSo,
 * liên kết nhau qua cột "MaTam" — mã tạm chỉ tồn tại trong file, không lưu vào DB).
 *
 * Thiết kế:
 *  - Đọc & parse toàn bộ file trước (không đụng DB).
 *  - Validate từng nhóm sản phẩm (theo MaTam) độc lập.
 *  - dryRun=true  → chỉ trả kết quả validate, KHÔNG ghi DB (dùng cho bước xem trước).
 *  - dryRun=false → gọi ProductImportRowProcessor.importOneProduct() cho từng nhóm,
 *    MỖI SẢN PHẨM 1 TRANSACTION RIÊNG → 1 sản phẩm lỗi không làm hỏng cả batch.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductImportServiceImpl implements ProductImportService {

    private static final int MAX_OPTION_SLOTS = 3;
    private static final String SHEET_PRODUCT = "SanPham";
    private static final String SHEET_VARIANT = "BienThe";
    private static final String SHEET_SPEC = "ThongSo";

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductImportRowProcessor rowProcessor;

    // ── DTOs nội bộ (chỉ dùng lúc parse, không phải entity) ─────────────────

    public record ProductRow(
            int rowNumber, String tempCode, String name, String categoryName, String description,
            BigDecimal price, BigDecimal salePrice, Integer stockQty, String sku,
            String mainImageUrl, Boolean active) {}

    public record VariantRow(
            int rowNumber, String tempCode, List<String[]> options, // {optionName, value}
            BigDecimal price, BigDecimal salePrice, Integer stockQty, String sku, String imageUrls) {}

    public record SpecRow(int rowNumber, String tempCode, String group, String key, String value) {}

    public record ImportGroup(ProductRow product, List<VariantRow> variants, List<SpecRow> specs) {}

    // ── Public API ────────────────────────────────────────────────────────

    @Override
    public ImportResultResponse importFromExcel(MultipartFile file, boolean dryRun) {
        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {

            List<ProductRow> productRows = readProductSheet(wb.getSheet(SHEET_PRODUCT));
            List<VariantRow> variantRows = readVariantSheet(wb.getSheet(SHEET_VARIANT));
            List<SpecRow> specRows = readSpecSheet(wb.getSheet(SHEET_SPEC));

            Map<String, List<VariantRow>> variantsByCode = variantRows.stream()
                    .collect(Collectors.groupingBy(VariantRow::tempCode, LinkedHashMap::new, Collectors.toList()));
            Map<String, List<SpecRow>> specsByCode = specRows.stream()
                    .collect(Collectors.groupingBy(SpecRow::tempCode, LinkedHashMap::new, Collectors.toList()));

            List<ImportErrorItem> errors = new ArrayList<>();
            List<ImportedItem> imported = new ArrayList<>();
            Set<String> seenCodes = new HashSet<>();

            for (ProductRow row : productRows) {
                if (row.tempCode() == null || row.tempCode().isBlank()) {
                    errors.add(err(SHEET_PRODUCT, row.rowNumber(), null, "Thiếu Mã tạm (MaTam)"));
                    continue;
                }
                if (!seenCodes.add(row.tempCode())) {
                    errors.add(err(SHEET_PRODUCT, row.rowNumber(), row.tempCode(),
                            "Mã tạm bị trùng trong sheet Sản phẩm"));
                    continue;
                }

                ImportGroup group = new ImportGroup(row,
                        variantsByCode.getOrDefault(row.tempCode(), List.of()),
                        specsByCode.getOrDefault(row.tempCode(), List.of()));

                try {
                    validateGroup(group);

                    Long productId = dryRun ? null : rowProcessor.importOneProduct(group);
                    imported.add(ImportedItem.builder()
                            .tempCode(row.tempCode())
                            .productId(productId)
                            .name(row.name())
                            .variantCount(group.variants().size())
                            .build());
                } catch (Exception e) {
                    log.warn("Import lỗi ở sản phẩm [{}]: {}", row.tempCode(), e.getMessage());
                    errors.add(err(SHEET_PRODUCT, row.rowNumber(), row.tempCode(), e.getMessage()));
                }
            }

            // Biến thể / thông số có Mã tạm không khớp sản phẩm nào → báo lỗi riêng để dễ soát
            Set<String> productCodes = productRows.stream().map(ProductRow::tempCode).collect(Collectors.toSet());
            variantRows.stream().filter(v -> !productCodes.contains(v.tempCode()))
                    .forEach(v -> errors.add(err(SHEET_VARIANT, v.rowNumber(), v.tempCode(),
                            "Mã tạm không khớp sản phẩm nào ở sheet Sản phẩm")));
            specRows.stream().filter(s -> !productCodes.contains(s.tempCode()))
                    .forEach(s -> errors.add(err(SHEET_SPEC, s.rowNumber(), s.tempCode(),
                            "Mã tạm không khớp sản phẩm nào ở sheet Sản phẩm")));

            return ImportResultResponse.builder()
                    .totalGroups(productRows.size())
                    .successCount(imported.size())
                    .errorCount(errors.size())
                    .imported(imported)
                    .errors(errors)
                    .build();

        } catch (IOException e) {
            throw new BusinessException("Không đọc được file Excel: " + e.getMessage());
        }
    }

    // ── Validate (không đụng DB ghi, chỉ đọc để kiểm tra) ────────────────────

    private void validateGroup(ImportGroup group) {
        ProductRow p = group.product();

        if (p.name() == null || p.name().isBlank())
            throw new BusinessException("Thiếu tên sản phẩm");
        if (p.categoryName() == null || p.categoryName().isBlank())
            throw new BusinessException("Thiếu danh mục");
        if (!categoryRepository.existsByNameIgnoreCase(p.categoryName().trim()))
            throw new BusinessException("Không tìm thấy danh mục: " + p.categoryName());
        if (p.price() == null || p.price().signum() < 0)
            throw new BusinessException("Giá không hợp lệ");
        if (p.sku() != null && !p.sku().isBlank() && productRepository.existsBySkuAndIdNot(p.sku(), -1L))
            throw new BusinessException("SKU sản phẩm đã tồn tại: " + p.sku());

        if (group.variants().isEmpty()) {
            if (p.stockQty() == null || p.stockQty() < 0)
                throw new BusinessException("Thiếu tồn kho (sản phẩm không có biến thể)");
        } else {
            Set<String> skuSeen = new HashSet<>();
            for (VariantRow v : group.variants()) {
                if (v.price() == null || v.price().signum() < 0)
                    throw new BusinessException("SKU dòng " + v.rowNumber() + ": giá không hợp lệ");
                if (v.stockQty() == null || v.stockQty() < 0)
                    throw new BusinessException("SKU dòng " + v.rowNumber() + ": tồn kho không hợp lệ");
                if (v.options().isEmpty())
                    throw new BusinessException("SKU dòng " + v.rowNumber() + ": thiếu loại biến thể");
                if (v.sku() != null && !v.sku().isBlank()) {
                    if (!skuSeen.add(v.sku()))
                        throw new BusinessException("SKU trùng trong file: " + v.sku());
                    if (productRepository.existsBySkuAndIdNot(v.sku(), -1L))
                        throw new BusinessException("SKU đã tồn tại trong hệ thống: " + v.sku());
                }
            }
        }
    }

    // ── Đọc sheet ─────────────────────────────────────────────────────────

    private List<ProductRow> readProductSheet(Sheet sheet) {
        if (sheet == null) throw new BusinessException("File thiếu sheet 'SanPham'");
        List<ProductRow> rows = new ArrayList<>();
        for (Row row : sheet) {
            if (row.getRowNum() == 0) continue; // header
            String tempCode = str(row, 0);
            if (isRowEmpty(tempCode, str(row, 1))) continue;

            rows.add(new ProductRow(
                    row.getRowNum() + 1, tempCode, str(row, 1), str(row, 2), str(row, 3),
                    decimal(row, 4), decimal(row, 5), integer(row, 6), str(row, 7),
                    str(row, 8), boolOrDefault(row, 9, true)));
        }
        return rows;
    }

    private List<VariantRow> readVariantSheet(Sheet sheet) {
        if (sheet == null) return List.of(); // sheet optional — sản phẩm có thể toàn bộ không biến thể
        List<VariantRow> rows = new ArrayList<>();
        for (Row row : sheet) {
            if (row.getRowNum() == 0) continue;
            String tempCode = str(row, 0);
            if (isRowEmpty(tempCode, null)) continue;

            List<String[]> options = new ArrayList<>();
            int col = 1;
            for (int slot = 0; slot < MAX_OPTION_SLOTS; slot++) {
                String optName = str(row, col);
                String optVal = str(row, col + 1);
                col += 2;
                if (optName != null && !optName.isBlank() && optVal != null && !optVal.isBlank()) {
                    options.add(new String[]{optName.trim(), optVal.trim()});
                }
            }

            rows.add(new VariantRow(
                    row.getRowNum() + 1, tempCode, options,
                    decimal(row, 7), decimal(row, 8), integer(row, 9), str(row, 10), str(row, 11)));
        }
        return rows;
    }

    private List<SpecRow> readSpecSheet(Sheet sheet) {
        if (sheet == null) return List.of();
        List<SpecRow> rows = new ArrayList<>();
        for (Row row : sheet) {
            if (row.getRowNum() == 0) continue;
            String tempCode = str(row, 0);
            if (isRowEmpty(tempCode, str(row, 1))) continue;

            rows.add(new SpecRow(row.getRowNum() + 1, tempCode, str(row, 1), str(row, 2), str(row, 3)));
        }
        return rows;
    }

    // ── Cell helpers ──────────────────────────────────────────────────────

    private boolean isRowEmpty(String a, String b) {
        return (a == null || a.isBlank()) && (b == null || b.isBlank());
    }

    private String str(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return null;
        cell.setCellType(CellType.STRING);
        String v = cell.getStringCellValue();
        return v == null || v.isBlank() ? null : v.trim();
    }

    private BigDecimal decimal(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return null;
        try {
            if (cell.getCellType() == CellType.STRING) {
                String s = cell.getStringCellValue();
                return s == null || s.isBlank() ? null : new BigDecimal(s.trim());
            }
            return BigDecimal.valueOf(cell.getNumericCellValue());
        } catch (Exception e) {
            return null;
        }
    }

    private Integer integer(Row row, int col) {
        BigDecimal d = decimal(row, col);
        return d == null ? null : d.intValue();
    }

    private Boolean boolOrDefault(Row row, int col, boolean def) {
        Cell cell = row.getCell(col);
        if (cell == null) return def;
        try {
            if (cell.getCellType() == CellType.BOOLEAN) return cell.getBooleanCellValue();
            String s = cell.getStringCellValue();
            if (s == null || s.isBlank()) return def;
            return s.trim().equalsIgnoreCase("true") || s.trim().equals("1");
        } catch (Exception e) {
            return def;
        }
    }

    private ImportErrorItem err(String sheet, int rowNumber, String tempCode, String message) {
        return ImportErrorItem.builder()
                .sheet(sheet).rowNumber(rowNumber).tempCode(tempCode).message(message).build();
    }

    // ── Sinh template ─────────────────────────────────────────────────────

    @Override
    public byte[] generateTemplate() {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle headerStyle = wb.createCellStyle();
            Font boldFont = wb.createFont();
            boldFont.setBold(true);
            headerStyle.setFont(boldFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            buildSheet(wb, SHEET_PRODUCT,
                    new String[]{"MaTam", "TenSanPham", "DanhMuc", "MoTa", "Gia", "GiaSale", "TonKho", "SKU", "AnhChinh", "KichHoat"},
                    new Object[]{"SP001", "iPhone 15", "Điện thoại", "Mô tả sản phẩm", 20000000, 18990000, "", "", "https://example.com/anh.jpg", true},
                    headerStyle);

            buildSheet(wb, SHEET_VARIANT,
                    new String[]{"MaTam", "Loai1_Ten", "Loai1_GiaTri", "Loai2_Ten", "Loai2_GiaTri", "Loai3_Ten", "Loai3_GiaTri", "Gia", "GiaSale", "TonKho", "SKU", "Anh"},
                    new Object[]{"SP001", "Màu sắc", "Đen", "RAM", "8GB", "", "", 20000000, 18990000, 50, "IP15-BLACK-8", "https://example.com/den.jpg"},
                    headerStyle);

            buildSheet(wb, SHEET_SPEC,
                    new String[]{"MaTam", "Nhom", "TenThongSo", "GiaTri"},
                    new Object[]{"SP001", "Cấu hình", "CPU", "Apple A17 Pro"},
                    headerStyle);

            buildInstructionSheet(wb, headerStyle);

            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new BusinessException("Không tạo được file mẫu: " + e.getMessage());
        }
    }

    private void buildSheet(XSSFWorkbook wb, String name, String[] headers, Object[] sampleRow, CellStyle headerStyle) {
        Sheet sheet = wb.createSheet(name);
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell c = headerRow.createCell(i);
            c.setCellValue(headers[i]);
            c.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, 18 * 256);
        }
        Row sample = sheet.createRow(1);
        for (int i = 0; i < sampleRow.length; i++) {
            Cell c = sample.createCell(i);
            Object v = sampleRow[i];
            if (v instanceof Number n) c.setCellValue(n.doubleValue());
            else if (v instanceof Boolean b) c.setCellValue(b);
            else c.setCellValue(String.valueOf(v));
        }
    }

    private void buildInstructionSheet(XSSFWorkbook wb, CellStyle headerStyle) {
        Sheet sheet = wb.createSheet("HuongDan");
        int r = 0;
        Row title = sheet.createRow(r++);
        title.createCell(0).setCellValue("Danh mục hiện có (gõ đúng tên vào cột DanhMuc)");
        for (Category c : categoryRepository.findByActiveTrueOrderByNameAsc()) {
            sheet.createRow(r++).createCell(0).setCellValue(c.getName());
        }
        r++;
        sheet.createRow(r++).createCell(0).setCellValue("Lưu ý:");
        String[] notes = {
                "- MaTam là mã tự đặt (VD: SP001) chỉ dùng để liên kết dữ liệu giữa 3 sheet, không lưu vào hệ thống.",
                "- Sản phẩm CÓ dòng ở sheet BienThe → bỏ trống TonKho/SKU ở sheet SanPham (hệ thống lấy theo từng SKU).",
                "- Tối đa 3 loại biến thể mỗi sản phẩm (VD: Màu sắc, RAM, Dung lượng).",
                "- Nhiều ảnh cách nhau bằng dấu chấm phẩy ';'.",
                "- KichHoat: TRUE = hiển thị, FALSE = ẩn. Bỏ trống = mặc định TRUE.",
        };
        for (String n : notes) sheet.createRow(r++).createCell(0).setCellValue(n);
        sheet.setColumnWidth(0, 90 * 256);
    }
}
