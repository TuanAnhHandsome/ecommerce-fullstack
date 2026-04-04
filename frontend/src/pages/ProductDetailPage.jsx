import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productAPI } from '../services/api'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'

// ── Lightbox component ────────────────────────────────────────────────────────
function Lightbox({ images, initialIndex, onClose }) {
  const [idx, setIdx] = useState(initialIndex)

  const prev = useCallback(() => setIdx(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setIdx(i => (i + 1) % images.length), [images.length])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-10"
      >
        <i className="fa-solid fa-xmark text-2xl"></i>
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm bg-black/40 px-3 py-1 rounded-full">
          {idx + 1} / {images.length}
        </div>
      )}

      {/* Prev */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev() }}
          className="absolute left-3 md:left-6 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors z-10"
        >
          <i className="fa-solid fa-chevron-left text-xl"></i>
        </button>
      )}

      {/* Image */}
      <img
        src={images[idx]}
        alt={`Ảnh ${idx + 1}`}
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl select-none"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next() }}
          className="absolute right-3 md:right-6 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors z-10"
        >
          <i className="fa-solid fa-chevron-right text-xl"></i>
        </button>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIdx(i) }}
              className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const addItem = useCartStore(s => s.addItem)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productAPI.getBySlug(slug).then(r => r.data),
  })

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p) + 'đ'

  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-200 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="text-center py-20 text-gray-400">
      <i className="fa-solid fa-circle-exclamation text-4xl mb-3 block"></i>
      Không tìm thấy sản phẩm
    </div>
  )

  const isOnSale = product.salePrice && product.salePrice < product.price

  // Hỗ trợ cả 1 ảnh (imageUrl) lẫn nhiều ảnh (images array)
  const images = product.images?.length
    ? product.images
    : product.imageUrl
      ? [product.imageUrl]
      : []

  const prevImg = () => setActiveImg(i => (i - 1 + images.length) % images.length)
  const nextImg = () => setActiveImg(i => (i + 1) % images.length)

  const handleAddToCart = () => {
    if (!isAuthenticated) { navigate('/login'); return }
    addItem(product.id, qty)
  }

  return (
    <>
      {lightboxOpen && images.length > 0 && (
        <Lightbox images={images} initialIndex={activeImg} onClose={() => setLightboxOpen(false)} />
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
          <a href="/" className="hover:text-red-500"><i className="fa-solid fa-house"></i></a>
          <i className="fa-solid fa-chevron-right text-xs"></i>
          <a href="/products" className="hover:text-red-500">Sản phẩm</a>
          <i className="fa-solid fa-chevron-right text-xs"></i>
          <span className="text-gray-600 line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* ── Image gallery ── */}
          <div>
            {/* Main image with nav arrows */}
            <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-3 border border-gray-100 group">
              {images.length > 0 ? (
                <img
                  src={images[activeImg]}
                  alt={product.name}
                  className="w-full h-full object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.02]"
                  onClick={() => setLightboxOpen(true)}
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                  <i className="fa-solid fa-image text-8xl mb-3"></i>
                  <span className="text-sm text-gray-400">Chưa có ảnh sản phẩm</span>
                </div>
              )}

              {/* Zoom hint */}
              {images.length > 0 && (
                <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <i className="fa-solid fa-magnifying-glass-plus mr-1"></i>Click để phóng to
                </div>
              )}

              {/* Prev / Next buttons — chỉ hiện khi có nhiều hơn 1 ảnh */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImg}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md text-gray-700 w-9 h-9 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                  >
                    <i className="fa-solid fa-chevron-left text-sm"></i>
                  </button>
                  <button
                    onClick={nextImg}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md text-gray-700 w-9 h-9 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                  >
                    <i className="fa-solid fa-chevron-right text-sm"></i>
                  </button>

                  {/* Dot indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`h-1.5 rounded-full transition-all ${i === activeImg ? 'w-5 bg-red-500' : 'w-1.5 bg-white/70 hover:bg-white'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail row */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      activeImg === i
                        ? 'border-red-500 shadow-md scale-105'
                        : 'border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`thumb-${i}`} className="w-full h-full object-cover" draggable={false} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product info ── */}
          <div>
            <p className="text-sm text-red-500 font-medium mb-2">
              <i className="fa-solid fa-tag mr-1"></i>{product.categoryName}
            </p>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">{product.name}</h1>

            {product.sku && (
              <p className="text-xs text-gray-400 mb-4">SKU: {product.sku}</p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-3xl font-bold text-red-500">{formatPrice(product.effectivePrice)}</span>
              {isOnSale && (
                <>
                  <span className="text-lg text-gray-400 line-through">{formatPrice(product.price)}</span>
                  <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-0.5 rounded-full">
                    -{Math.round((1 - product.salePrice / product.price) * 100)}%
                  </span>
                </>
              )}
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-2 mb-6">
              {product.stockQty > 0 ? (
                <span className="text-sm text-green-600 font-medium">
                  <i className="fa-solid fa-circle-check mr-1"></i>
                  Còn hàng ({product.stockQty} cái)
                </span>
              ) : (
                <span className="text-sm text-red-500 font-medium">
                  <i className="fa-solid fa-circle-xmark mr-1"></i>Hết hàng
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  <i className="fa-solid fa-circle-info mr-1 text-blue-500"></i>Mô tả sản phẩm
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Quantity + Add to cart */}
            {product.stockQty > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-20">Số lượng:</span>
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="px-4 py-2.5 hover:bg-gray-50 text-gray-600 font-bold transition-colors">
                      <i className="fa-solid fa-minus text-xs"></i>
                    </button>
                    <span className="px-5 py-2.5 text-sm font-bold border-x border-gray-200">{qty}</span>
                    <button onClick={() => setQty(q => Math.min(product.stockQty, q + 1))}
                      className="px-4 py-2.5 hover:bg-gray-50 text-gray-600 font-bold transition-colors">
                      <i className="fa-solid fa-plus text-xs"></i>
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={handleAddToCart} className="btn-primary flex-1 py-3">
                    <i className="fa-solid fa-cart-plus mr-2"></i>Thêm vào giỏ hàng
                  </button>
                  <button onClick={() => { handleAddToCart(); navigate('/cart') }}
                    className="btn-secondary px-5 py-3">
                    <i className="fa-solid fa-bolt text-yellow-500"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Shipping info */}
            <div className="mt-6 pt-6 border-t border-gray-100 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <i className="fa-solid fa-truck text-blue-500 w-5"></i>
                <span>Miễn phí vận chuyển cho đơn từ 500.000đ</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <i className="fa-solid fa-shield-halved text-green-500 w-5"></i>
                <span>Bảo hành chính hãng 12 tháng</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <i className="fa-solid fa-rotate-left text-orange-500 w-5"></i>
                <span>Đổi trả trong 7 ngày nếu lỗi nhà sản xuất</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}