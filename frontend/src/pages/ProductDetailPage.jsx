import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productAPI } from '../services/api'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { useProductVariant } from '../hooks/useProductVariant'

import Lightbox from '../components/product/Lightbox'
import ProductImages from '../components/product/ProductImages'
import ProductInfo from '../components/product/ProductInfo'
import ProductReviews from '../components/product/ProductReviews'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedValues, setSelectedValues] = useState({})
  const [activeTab, setActiveTab] = useState('spec')
  const [reviewPage, setReviewPage] = useState(0)
  const [wishlist, setWishlist] = useState(false)

  const addItem = useCartStore(s => s.addItem)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productAPI.getBySlug(slug).then(r => r.data),
  })

  const { data: reviewData } = useQuery({
    queryKey: ['reviews', product?.id, reviewPage],
    queryFn: () => productAPI.getReviews
      ? productAPI.getReviews(product.id, { page: reviewPage, size: 5 }).then(r => r.data)
      : null,
    enabled: !!product?.id,
  })

  const {
    allImages,
    variantImgIndex,
    currentPrice, originalPrice, salePrice,
    isOnSale, currentStock, discountPct,
  } = useProductVariant(product, selectedValues)

  // Khi chọn biến thể → nhảy đến ảnh của biến thể đó
  // Người dùng vẫn có thể lướt tự do sau đó
  useEffect(() => {
    if (variantImgIndex >= 0) {
      setActiveImg(variantImgIndex)
    }
  }, [variantImgIndex])

  const handleSelectValue = (optName, value) => {
    setSelectedValues(prev => {
      if (prev[optName] === value) {
        const next = { ...prev }
        delete next[optName]
        return next
      }
      return { ...prev, [optName]: value }
    })
    setQty(1)
  }

  const handleAddToCart = () => {
    if (!isAuthenticated) { navigate('/login'); return }
    addItem(product.id, qty)
  }

  const handleBuyNow = () => {
    if (!isAuthenticated) { navigate('/login'); return }
    addItem(product.id, qty)
    navigate('/checkout')
  }

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

  return (
    <>
      {lightboxOpen && allImages.length > 0 && (
        <Lightbox
          images={allImages}
          initialIndex={activeImg}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2 flex-wrap">
          <a href="/" className="hover:text-red-500"><i className="fa-solid fa-house"></i></a>
          <i className="fa-solid fa-chevron-right text-xs"></i>
          <a href="/products" className="hover:text-red-500">Sản phẩm</a>
          <i className="fa-solid fa-chevron-right text-xs"></i>
          <span className="text-gray-600 line-clamp-1">{product.name}</span>
        </nav>

        {/* Image + Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
          <ProductImages
            displayImages={allImages}
            activeImg={activeImg}
            setActiveImg={setActiveImg}
            isOnSale={isOnSale}
            discountPct={discountPct}
            wishlist={wishlist}
            setWishlist={setWishlist}
            onOpenLightbox={() => setLightboxOpen(true)}
          />
          <ProductInfo
            product={product}
            currentPrice={currentPrice}
            originalPrice={originalPrice}
            salePrice={salePrice}
            isOnSale={isOnSale}
            discountPct={discountPct}
            currentStock={currentStock}
            selectedValues={selectedValues}
            handleSelectValue={handleSelectValue}
            qty={qty}
            setQty={setQty}
            handleAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 mb-6 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {[
              { key: 'spec', label: 'Thông số kỹ thuật', icon: 'fa-microchip' },
              { key: 'desc', label: 'Mô tả chi tiết', icon: 'fa-align-left' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className={`fa-solid ${tab.icon} text-xs`}></i>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-6">
            {activeTab === 'spec' && (
              product.variantOptions?.length > 0 ? (
                <div>
                  {product.variantOptions.map(opt => (
                    <div key={opt.id} className="flex py-3 border-b border-gray-50 last:border-0 text-sm">
                      <span className="text-gray-500 w-40 flex-shrink-0">{opt.name}</span>
                      <span className="text-gray-800 font-medium">
                        {opt.values.map(v => v.value).join(' / ')}
                      </span>
                    </div>
                  ))}
                  {product.sku && (
                    <div className="flex py-3 text-sm">
                      <span className="text-gray-500 w-40 flex-shrink-0">SKU</span>
                      <span className="text-gray-800 font-medium">{product.sku}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Chưa có thông số kỹ thuật</p>
              )
            )}
            {activeTab === 'desc' && (
              product.description ? (
                <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                  {product.description}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Chưa có mô tả</p>
              )
            )}
          </div>
        </div>

        {/* Reviews */}
        <ProductReviews
          product={product}
          reviewData={reviewData}
          reviewPage={reviewPage}
          setReviewPage={setReviewPage}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </>
  )
}