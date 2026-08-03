package com.ecommerce.service;

import com.ecommerce.dto.request.ProductRequest;
import com.ecommerce.dto.response.PageResponse;
import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.entity.Category;
import com.ecommerce.entity.Product;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.*;
import com.ecommerce.service.impl.ProductServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private ProductImageRepository productImageRepository;
    @Mock
    private VariantOptionRepository variantOptionRepository;
    @Mock
    private ProductVariantRepository variantRepository;
    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private CloudinaryService cloudinaryService;
    @Mock
    private ProductSpecRepository productSpecRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    private Product sampleProduct;
    private Category sampleCategory;

    @BeforeEach
    void setUp() {
        sampleCategory = Category.builder()
                .id(1L)
                .name("Điện thoại")
                .build();

        sampleProduct = Product.builder()
                .id(100L)
                .category(sampleCategory)
                .name("iPhone 15 Pro Max")
                .slug("iphone-15-pro-max")
                .price(BigDecimal.valueOf(30000000))
                .salePrice(BigDecimal.valueOf(28000000))
                .stockQty(50)
                .sku("IP15PM-256")
                .active(true)
                .imageUrl("http://image.url/iphone15.jpg")
                .build();
    }

    // Helper mock cho Batch Data
    private void mockEmptyBatchData() {
        when(productImageRepository.findByProductIdInOrderBySortOrder(anyList())).thenReturn(Collections.emptyList());
        when(reviewRepository.aggregateByProductIds(anyList())).thenReturn(Collections.emptyList());
        when(variantOptionRepository.findByProductIdInOrderBySortOrder(anyList())).thenReturn(Collections.emptyList());
        when(variantRepository.findByProductIdInWithValues(anyList())).thenReturn(Collections.emptyList());
        when(variantRepository.findByProductIdInWithImages(anyList())).thenReturn(Collections.emptyList());
        when(productSpecRepository.findByProductIdInOrdered(anyList())).thenReturn(Collections.emptyList());
    }

    @Nested
    @DisplayName("Các test case READ (Đọc dữ liệu)")
    class ReadOperations {

        @Test
        @DisplayName("getProductBySlug - Thành công khi tồn tại sản phẩm")
        void getProductBySlug_Success() {
            // Given
            when(productRepository.findBySlug("iphone-15-pro-max")).thenReturn(Optional.of(sampleProduct));
            mockEmptyBatchData();

            // When
            ProductResponse response = productService.getProductBySlug("iphone-15-pro-max");

            // Then
            assertNotNull(response);
            assertEquals(100L, response.getId());
            assertEquals("iPhone 15 Pro Max", response.getName());
            assertEquals("iphone-15-pro-max", response.getSlug());
            assertEquals(BigDecimal.valueOf(30000000), response.getPrice());
            assertEquals(50, response.getStockQty());
            verify(productRepository, times(1)).findBySlug("iphone-15-pro-max");
        }

        @Test
        @DisplayName("getProductBySlug - Thất bại ném ResourceNotFoundException khi slug không tồn tại")
        void getProductBySlug_NotFound() {
            // Given
            when(productRepository.findBySlug("invalid-slug")).thenReturn(Optional.empty());

            // When & Then
            ResourceNotFoundException exception = assertThrows(
                    ResourceNotFoundException.class,
                    () -> productService.getProductBySlug("invalid-slug"));
            assertTrue(exception.getMessage().contains("Không tìm thấy sản phẩm"));
        }

        @Test
        @DisplayName("getProducts - Lấy danh sách phân trang thành công với Batch Data Optimization")
        void getProducts_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<Product> productPage = new PageImpl<>(List.of(sampleProduct), pageable, 1);

            when(productRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(productPage);
            mockEmptyBatchData();

            // When
            PageResponse<ProductResponse> response = productService.getProducts(pageable, null, null, null, null);

            // Then
            assertNotNull(response);
            assertEquals(1, response.getContent().size());
            assertEquals("iPhone 15 Pro Max", response.getContent().get(0).getName());
            verify(productRepository, times(1)).findAll(any(Specification.class), eq(pageable));
        }
    }

    @Nested
    @DisplayName("Các test case WRITE (Tạo, Sửa, Xóa)")
    class WriteOperations {

        @Test
        @DisplayName("createProduct - Tạo mới sản phẩm thành công không bao gồm ảnh")
        void createProduct_Success_WithoutImages() {
            // Given
            ProductRequest request = new ProductRequest();
            request.setCategoryId(1L);
            request.setName("iPhone 15 Pro Max");
            request.setPrice(BigDecimal.valueOf(30000000));
            request.setStockQty(50);
            request.setSku("IP15PM-256");

            when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
            when(productRepository.existsBySlug(anyString())).thenReturn(false);
            when(productRepository.save(any(Product.class))).thenReturn(sampleProduct);
            mockEmptyBatchData();

            // When
            ProductResponse response = productService.createProduct(request, null);

            // Then
            assertNotNull(response);
            assertEquals("iPhone 15 Pro Max", response.getName());
            verify(productRepository, times(1)).save(any(Product.class));

            // Xóa specs cũ nhưng không saveAll vì list specs gửi lên bị null
            verify(productSpecRepository, times(1)).deleteByProductId(100L);
            verify(productSpecRepository, never()).saveAll(anyList());
        }

        @Test
        @DisplayName("setActive - Cập nhật trạng thái active thành công")
        void setActive_Success() {
            // Given
            when(productRepository.findById(100L)).thenReturn(Optional.of(sampleProduct));

            // When
            productService.setActive(100L, false);

            // Then
            assertFalse(sampleProduct.getActive());
            verify(productRepository, times(1)).save(sampleProduct);
        }

        @Test
        @DisplayName("deleteProduct - Xóa mềm (chuyển active = false)")
        void deleteProduct_Success() {
            // Given
            when(productRepository.findById(100L)).thenReturn(Optional.of(sampleProduct));

            // When
            productService.deleteProduct(100L);

            // Then
            assertFalse(sampleProduct.getActive());
            verify(productRepository, times(1)).save(sampleProduct);
        }
    }
}