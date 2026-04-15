package com.ecommerce.controller;

import com.ecommerce.entity.Category;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final CloudinaryService cloudinaryService;

    @GetMapping
    public ResponseEntity<List<Category>> getAll() {
        return ResponseEntity.ok(categoryRepository.findByActiveTrueOrderByNameAsc());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Category> getById(@PathVariable Long id) {
        return ResponseEntity.ok(
            categoryRepository.findById(id)
                .orElseThrow(() -> new com.ecommerce.exception.ResourceNotFoundException(
                    "Không tìm thấy danh mục ID: " + id))
        );
    }

    @PostMapping(consumes = { "multipart/form-data", "application/json" })
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Category> create(
            @RequestParam("name") String name,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        if (name == null || name.isBlank())
            return ResponseEntity.badRequest().build();

        Category cat = new Category();
        cat.setName(name.trim());
        cat.setSlug(generateSlug(name));
        cat.setActive(true);

        if (image != null && !image.isEmpty()) {
            String url = cloudinaryService.uploadImage(image, "ecommerce/categories");
            cat.setImageUrl(url);
        }

        return ResponseEntity.ok(categoryRepository.save(cat));
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Category> update(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "removeImage", defaultValue = "false") boolean removeImage) {

        Category cat = categoryRepository.findById(id)
            .orElseThrow(() -> new com.ecommerce.exception.ResourceNotFoundException(
                "Không tìm thấy danh mục ID: " + id));

        // Cập nhật tên + slug nếu tên thay đổi
        if (!cat.getName().equals(name.trim())) {
            cat.setName(name.trim());
            cat.setSlug(generateSlug(name));
        }

        // Xóa ảnh cũ nếu yêu cầu hoặc có ảnh mới
        if ((removeImage || (image != null && !image.isEmpty())) && cat.getImageUrl() != null) {
            cloudinaryService.deleteImage(cat.getImageUrl());
            cat.setImageUrl(null);
        }

        // Upload ảnh mới
        if (image != null && !image.isEmpty()) {
            String url = cloudinaryService.uploadImage(image, "ecommerce/categories");
            cat.setImageUrl(url);
        }

        return ResponseEntity.ok(categoryRepository.save(cat));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Category cat = categoryRepository.findById(id)
            .orElseThrow(() -> new com.ecommerce.exception.ResourceNotFoundException(
                "Không tìm thấy danh mục ID: " + id));

        if (cat.getImageUrl() != null) {
            cloudinaryService.deleteImage(cat.getImageUrl());
        }

        // Soft delete thay vì xóa hẳn để không ảnh hưởng sản phẩm đang dùng
        cat.setActive(false);
        categoryRepository.save(cat);
        return ResponseEntity.noContent().build();
    }

    private String generateSlug(String name) {
        String slug = Normalizer.normalize(name, Normalizer.Form.NFD)
            .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
            .replaceAll("đ", "d").replaceAll("Đ", "D")
            .toLowerCase().trim()
            .replaceAll("[^a-z0-9\\s-]", "")
            .replaceAll("\\s+", "-");

        String base = slug;
        int i = 1;
        while (categoryRepository.existsBySlug(slug)) {
            slug = base + "-" + i++;
        }
        return slug;
    }
}