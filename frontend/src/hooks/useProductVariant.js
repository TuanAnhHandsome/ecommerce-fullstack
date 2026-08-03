import { useMemo } from 'react'

/**
 * useProductVariant
 *
 * Trả về:
 *  - allImages      : toàn bộ ảnh gallery (ảnh chính + ảnh các biến thể, không trùng)
 *  - variantImgIndex: index trong allImages của ảnh biến thể đang chọn (-1 nếu chưa chọn)
 *  - bestVariant    : variant khớp đủ tất cả selectedValues (không chấp nhận partial match)
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
      isOnSale: !!(product?.salePrice && product.salePrice < product.price),
      currentStock: product?.stockQty ?? 0,
      discountPct: product?.salePrice && product.salePrice < product.price
        ? Math.round((1 - product.salePrice / product.price) * 100)
        : 0,
    }

    if (!product?.variants?.length) return fallback

    const selectedEntries = Object.entries(selectedValues).filter(([, v]) => v)

    // ── Bug 2 fix: chỉ chấp nhận variant khớp ĐỦ tất cả selectedValues ──────
    // Partial match (khớp 1/2 thuộc tính) không được dùng để tính giá/stock/ảnh
    let bestVariant = null
    if (selectedEntries.length > 0) {
      const fullyMatched = product.variants.filter(v =>
        v.active &&
        selectedEntries.every(([, val]) => v.valueLabels?.includes(val))
      )
      // Ưu tiên variant còn hàng; nếu không có thì lấy cái đầu tiên (để hiển thị "hết hàng")
      bestVariant = fullyMatched.find(v => v.stockQty > 0) ?? fullyMatched[0] ?? null
    }

    // ── Build gallery ─────────────────────────────────────────────────────────
    const mainImages = product.images ?? []
    const variantImages = (product.variants ?? [])
      .flatMap(v => v.images ?? [])
      .filter(Boolean)

    const seen = new Set()
    const allImages = []
    for (const url of [...mainImages, ...variantImages]) {
      if (!seen.has(url)) { seen.add(url); allImages.push(url) }
    }

    // ── Bug 3 fix: normalize URL trước khi indexOf để tránh mismatch ──────────
    // Loại bỏ trailing slash và query string khi so sánh, giữ URL gốc trong allImages
    const normalizeUrl = (url) => {
      try {
        const u = new URL(url)
        // Giữ origin + pathname, bỏ search/hash
        return (u.origin + u.pathname).replace(/\/$/, '')
      } catch {
        return url.split('?')[0].replace(/\/$/, '')
      }
    }

    const normalizedAllImages = allImages.map(normalizeUrl)

    let variantImgIndex = -1
    if (bestVariant?.images?.length) {
      const firstVariantImg = bestVariant.images[0]
      const normalizedTarget = normalizeUrl(firstVariantImg)

      // Tìm theo normalized URL trước, fallback về indexOf gốc
      variantImgIndex = normalizedAllImages.indexOf(normalizedTarget)
      if (variantImgIndex === -1) {
        variantImgIndex = allImages.indexOf(firstVariantImg)
      }

      // Nếu ảnh variant hoàn toàn không nằm trong allImages (URL khác hoàn toàn)
      // thêm nó vào đầu allImages để người dùng vẫn thấy đúng ảnh
      if (variantImgIndex === -1 && firstVariantImg) {
        allImages.unshift(firstVariantImg)
        variantImgIndex = 0
      }
    }

    // ── Giá / stock ───────────────────────────────────────────────────────────
    const src = bestVariant ?? product
    const price = src.price ?? 0
    const sale = src.salePrice ?? null
    const effective = (sale && sale < price) ? sale : price
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