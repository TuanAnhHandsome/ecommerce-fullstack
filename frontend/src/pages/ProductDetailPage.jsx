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

// ── Specs Table ───────────────────────────────────────────────────────────────
function SpecsTable({ specs }) {
  // specs: { "Cấu hình": [{key,value}], "Màn hình": [...] }
  const hasSpecs = specs && Object.keys(specs).length > 0

  if (!hasSpecs) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-300 gap-2">
        <i className="fa-solid fa-microchip text-3xl"></i>
        <p className="text-sm text-gray-400">Chưa có thông số kỹ thuật</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(specs).map(([group, rows]) => (
        <div key={group}>
          {/* Group header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              {group}
            </span>
            <div className="flex-1 h-px bg-indigo-50"></div>
          </div>

          {/* Rows */}
          <div className="rounded-xl overflow-hidden border border-gray-100">
            {rows.map((row, i) => (
              <div key={i}
                className={`flex text-sm ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                <span className="w-44 flex-shrink-0 px-4 py-2.5 text-gray-500 font-medium border-r border-gray-100">
                  {row.key}
                </span>
                <span className="flex-1 px-4 py-2.5 text-gray-800">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const { slug } = useParams()
  const navigate  = useNavigate()
  const [qty, setQty]                       = useState(1)
  const [activeImg, setActiveImg]           = useState(0)
  const [lightboxOpen, setLightboxOpen]     = useState(false)
  const [selectedValues, setSelectedValues] = useState({})
  const [wishlist, setWishlist]             = useState(false)
  const [reviewPage, setReviewPage]         = useState(0)

  // Chọn tab mặc định: nếu có specs → 'spec', không thì 'desc'
  const [activeTab, setActiveTab] = useState('spec')

  const addItem       = useCartStore(s => s.addItem)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const isNumeric     = /^\d+$/.test(slug)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => isNumeric
      ? productAPI.getById(slug).then(r => r.data)
      : productAPI.getBySlug(slug).then(r => r.data),
  })

  const { data: reviewData } = useQuery({
    queryKey: ['reviews', product?.id, reviewPage],
    queryFn: () => productAPI.getReviews
      ? productAPI.getReviews(product.id, { page: reviewPage, size: 5 }).then(r => r.data)
      : null,
    enabled: !!product?.id,
  })

  const {
    allImages, variantImgIndex,
    currentPrice, originalPrice, salePrice,
    isOnSale, currentStock, discountPct,
  } = useProductVariant(product, selectedValues)

  useEffect(() => {
    if (variantImgIndex >= 0) setActiveImg(variantImgIndex)
  }, [variantImgIndex])

  // Khi product load xong: nếu không có specs → mặc định tab 'desc'
  useEffect(() => {
    if (!product) return
    const hasSpecs = product.specs && Object.keys(product.specs).length > 0
    setActiveTab(hasSpecs ? 'spec' : 'desc')
  }, [product?.id])

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

  // ── Loading ────────────────────────────────────────────────────────────────
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

  const hasSpecs = product.specs && Object.keys(product.specs).length > 0
  const totalSpecs = hasSpecs
    ? Object.values(product.specs).reduce((acc, rows) => acc + rows.length, 0)
    : 0

  const TABS = [
    {
      key:   'spec',
      label: 'Thông số kỹ thuật',
      icon:  'fa-microchip',
      badge: hasSpecs ? totalSpecs : null,
    },
    {
      key:   'desc',
      label: 'Mô tả chi tiết',
      icon:  'fa-align-left',
      badge: null,
    },
  ]

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
          <a href="/" className="hover:text-indigo-500 transition-colors">
            <i className="fa-solid fa-house"></i>
          </a>
          <i className="fa-solid fa-chevron-right text-xs"></i>
          <a href="/products" className="hover:text-indigo-500 transition-colors">Sản phẩm</a>
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

        {/* Tabs: Thông số + Mô tả */}
        <div className="bg-white rounded-2xl border border-gray-100 mb-6 overflow-hidden">

          {/* Tab buttons */}
          <div className="flex border-b border-gray-100">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium
                  border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className={`fa-solid ${tab.icon} text-xs`}></i>
                {tab.label}
                {tab.badge && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === tab.key
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-6">

            {/* ── Thông số kỹ thuật ── */}
            {activeTab === 'spec' && (
              <SpecsTable specs={product.specs} />
            )}

            {/* ── Mô tả chi tiết ── */}
            {activeTab === 'desc' && (
              product.description ? (
                <div className="prose prose-sm max-w-none text-gray-600
                  leading-relaxed whitespace-pre-line">
                  {product.description}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10
                  text-gray-300 gap-2">
                  <i className="fa-solid fa-align-left text-3xl"></i>
                  <p className="text-sm text-gray-400">Chưa có mô tả chi tiết</p>
                </div>
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