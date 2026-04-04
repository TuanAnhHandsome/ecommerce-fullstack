package com.ecommerce.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public String uploadImage(MultipartFile file) {
        try {
            Map result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                    "folder",        "ecommerce/products",
                    "resource_type", "auto"
                )
            );
            String url = (String) result.get("secure_url");
            log.info("Uploaded to Cloudinary: {}", url);
            return url;
        } catch (IOException e) {
            throw new RuntimeException("Upload ảnh thất bại: " + e.getMessage());
        }
    }

    public void deleteImage(String imageUrl) {
        if (imageUrl == null || !imageUrl.contains("cloudinary.com")) return;
        try {
            String publicId = extractPublicId(imageUrl);
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Deleted from Cloudinary: {}", publicId);
        } catch (IOException e) {
            log.error("Xóa ảnh thất bại: {}", e.getMessage());
        }
    }

    private String extractPublicId(String imageUrl) {
        // URL: https://res.cloudinary.com/cloud/image/upload/v123456/ecommerce/products/abc.jpg
        // public_id cần: ecommerce/products/abc
        int uploadIndex = imageUrl.indexOf("/upload/");
        String afterUpload = imageUrl.substring(uploadIndex + 8);
        // Bỏ version (v1234567/)
        if (afterUpload.matches("v\\d+/.*")) {
            afterUpload = afterUpload.substring(afterUpload.indexOf("/") + 1);
        }
        // Bỏ extension (.jpg, .png, ...)
        return afterUpload.substring(0, afterUpload.lastIndexOf("."));
    }
}
