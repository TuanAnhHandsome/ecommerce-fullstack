import { useMemo } from 'react'

/**
 * useProductVariant
 *
 * Trả về:
 *  - allImages      : toàn bộ ảnh gallery (ảnh chính + ảnh các biến thể, không trùng)
 *  - variantImgIndex: index trong allImages của ảnh biến thể đang chọn (-1 nếu chưa chọn)
 *  - bestVariant    : variant khớp nhất với selectedValues
 *  - currentPrice, originalPrice, salePrice, isOnSale, currentStock, discountPct
 */
export function useProductVariant(product, selectedValues = {}) {
  return useMemo(() => {
    const fallback = {
      allImages: product?.images ?? [],
      variantImgIndex: -1,
      bestVariant: null,
      currentPrice: product?.effectivePrice ?? product?.price ?? 0,
      originalPrice: product?.price ?? 0,
      salePrice: product?.salePrice ?? null,
      isOnSale: !!product?.salePrice,
      currentStock: product?.stockQty ?? 0,
      discountPct: 0,
    }

    if (!product?.variants?.length) return fallback

    const selectedEntries = Object.entries(selectedValues).filter(([, v]) => v)

    // Tìm variant khớp nhiều nhất với selectedValues
    let bestVariant = null
    let bestScore = -1
    for (const v of product.variants) {
      if (!v.active) continue
      const score = selectedEntries.filter(([, val]) =>
        v.valueLabels?.includes(val)
      ).length
      if (score > bestScore) {
        bestScore = score
        bestVariant = v
      }
    }

    // Nếu không chọn gì → không highlight biến thể nào
    if (selectedEntries.length === 0) bestVariant = null

    // ── Build gallery ─────────────────────────────────────────────────────
    // 1. Ảnh chính sản phẩm
    const mainImages = product.images ?? []

    // 2. Ảnh từ tất cả biến thể (gộp, loại trùng)
    const variantImages = (product.variants ?? [])
      .flatMap(v => v.images ?? [])
      .filter(Boolean)

    // Gộp: mainImages trước, variant images sau (loại trùng URL)
    const seen = new Set()
    const allImages = []
    for (const url of [...mainImages, ...variantImages]) {
      if (!seen.has(url)) { seen.add(url); allImages.push(url) }
    }

    // Index của ảnh đầu tiên thuộc bestVariant trong allImages
    let variantImgIndex = -1
    if (bestVariant?.images?.length) {
      const firstVariantImg = bestVariant.images[0]
      variantImgIndex = allImages.indexOf(firstVariantImg)
    }

    // ── Giá / stock ───────────────────────────────────────────────────────
    const src = bestVariant ?? product
    const price = src.price ?? 0
    const sale = src.salePrice ?? null
    const effective = sale ?? price
    const isOnSale = !!sale && sale < price
    const discountPct = isOnSale ? Math.round((1 - sale / price) * 100) : 0

    return {
      allImages,
      variantImgIndex,
      bestVariant,
      currentPrice: effective,
      originalPrice: price,
      salePrice: sale,
      isOnSale,
      currentStock: bestVariant?.stockQty ?? product?.stockQty ?? 0,
      discountPct,
    }
  }, [product, selectedValues])
}