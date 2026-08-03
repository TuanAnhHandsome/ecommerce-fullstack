package com.ecommerce.repository;

import com.ecommerce.entity.Category;
import com.ecommerce.entity.Product;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;

public class ProductSpecification {

    public static Specification<Product> isActive() {
        return (root, query, cb) -> cb.isTrue(root.get("active"));
    }

    public static Specification<Product> hasKeyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) return null;

            query.distinct(true);

            String pattern = "%" + keyword.toLowerCase() + "%";

            var categoryJoin = root.<Product, Category>join("category", JoinType.LEFT);

            return cb.or(
                cb.like(cb.lower(root.get("name")),          pattern),
                cb.like(cb.lower(root.get("description")),   pattern),
                cb.like(cb.lower(categoryJoin.get("name")),  pattern)
            );
        };
    }

    public static Specification<Product> hasCategory(Long categoryId) {
        return (root, query, cb) ->
                categoryId == null ? null :
                cb.equal(root.get("category").get("id"), categoryId);
    }

    public static Specification<Product> minPrice(BigDecimal min) {
        return (root, query, cb) ->
                min == null ? null :
                cb.greaterThanOrEqualTo(
                        cb.coalesce(root.get("salePrice"), root.get("price")), min);
    }

    public static Specification<Product> maxPrice(BigDecimal max) {
        return (root, query, cb) ->
                max == null ? null :
                cb.lessThanOrEqualTo(
                        cb.coalesce(root.get("salePrice"), root.get("price")), max);
    }
}