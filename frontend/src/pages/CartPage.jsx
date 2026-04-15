import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'

export default function CartPage() {
  const navigate = useNavigate()
  const { items, totalAmount, totalItems, fetchCart, updateItem, removeItem, loading } = useCartStore()

  // ─── Checkbox state ───────────────────────────────────────────────────────
  const [selected, setSelected] = useState(new Set())

  // Khi giỏ hàng load xong → chọn tất cả mặc định
  useEffect(() => {
    fetchCart()
  }, [])

  useEffect(() => {
    if (items.length > 0) {
      setSelected(new Set(items.map(i => i.productId)))
    }
  }, [items.length])

  const allSelected = items.length > 0 && selected.size === items.length
  const someSelected = selected.size > 0 && !allSelected

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(items.map(i => i.productId)))
    }
  }

  const toggleOne = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ─── Số lượng & xóa ──────────────────────────────────────────────────────
  const handleUpdateQuantity = useCallback((id, newQty) => {
    if (newQty < 1) {
      if (window.confirm('Bạn có muốn xóa sản phẩm này khỏi giỏ hàng không?')) {
        removeItem(id)
        setSelected(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    } else {
      updateItem(id, newQty)
    }
  }, [removeItem, updateItem])

  const handleRemove = (id) => {
    if (window.confirm('Bạn có muốn xóa sản phẩm này khỏi giỏ hàng không?')) {
      removeItem(id)
      setSelected(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleRemoveSelected = () => {
    if (selected.size === 0) return
    if (window.confirm(`Xóa ${selected.size} sản phẩm đã chọn?`)) {
      selected.forEach(id => removeItem(id))
      setSelected(new Set())
    }
  }

  // ─── Tính tiền chỉ cho sản phẩm được chọn ────────────────────────────────
  const selectedItems = items.filter(i => selected.has(i.productId))
  const selectedTotal = selectedItems.reduce((s, i) => s + i.subtotal, 0)
  const shippingFee = selectedTotal >= 500000 ? 0 : (selectedTotal > 0 ? 30000 : 0)
  const finalAmount = selectedTotal + shippingFee

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p) + 'đ'

  // ─── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
      {[1, 2, 3].map(n => (
        <div key={n} className="bg-white rounded-2xl p-4 flex gap-4 mb-3">
          <div className="w-20 h-20 bg-gray-200 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )

  // ─── Giỏ trống ────────────────────────────────────────────────────────────
  if (!loading && items.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <i className="fa-solid fa-cart-shopping text-4xl text-gray-300"></i>
      </div>
      <h2 className="text-xl font-bold text-gray-700 mb-2">Giỏ hàng trống</h2>
      <p className="text-gray-400 mb-6">Hãy thêm sản phẩm vào giỏ hàng của bạn!</p>
      <Link to="/products" className="btn-primary px-8 py-3 inline-flex items-center gap-2">
        <i className="fa-solid fa-bag-shopping"></i>Mua sắm ngay
      </Link>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-28 lg:pb-8">
      {/* Tiêu đề */}
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 flex-wrap">
        <i className="fa-solid fa-cart-shopping text-red-500"></i>
        Giỏ hàng
        <span className="text-base font-normal text-gray-400">({totalItems} sản phẩm)</span>
        {selected.size > 0 && (
          <span className="text-sm font-normal bg-red-50 text-red-500 px-3 py-1 rounded-full">
            Đã chọn: {selected.size}
          </span>
        )}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Danh sách sản phẩm ── */}
        <div className="lg:col-span-2 space-y-3">

          {/* Select all row */}
          <div className="card p-3 flex items-center gap-3">
            <input
              type="checkbox"
              checked={allSelected}
              ref={el => { if (el) el.indeterminate = someSelected }}
              onChange={toggleAll}
              className="w-4 h-4 accent-red-500 cursor-pointer"
            />
            <label onClick={toggleAll} className="flex-1 text-sm text-gray-600 cursor-pointer select-none">
              Chọn tất cả ({items.length} sản phẩm)
            </label>
            {selected.size > 0 && (
              <button
                onClick={handleRemoveSelected}
                className="text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
              >
                <i className="fa-solid fa-trash mr-1"></i>Xóa đã chọn
              </button>
            )}
          </div>

          {/* Items */}
          {items.map(item => {
            const isSelected = selected.has(item.productId)
            const isLowStock = item.maxStock <= 5
            const hasDiscount = item.originalPrice && item.originalPrice > item.unitPrice
            const discountPct = hasDiscount
              ? Math.round((1 - item.unitPrice / item.originalPrice) * 100)
              : 0

            return (
              <div
                key={item.productId}
                className={`card p-4 flex gap-3 transition-all ${isSelected ? 'ring-1 ring-red-300 bg-red-50/30' : 'opacity-70'}`}
              >
                {/* Checkbox */}
                <div className="flex items-center pt-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOne(item.productId)}
                    className="w-4 h-4 accent-red-500 cursor-pointer"
                  />
                </div>

                {/* Ảnh (click → chi tiết sản phẩm) */}
                <div
                  className="relative w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group"
                  onClick={() => navigate(`/products/${item.productSlug || item.productId}`)}
                  title="Xem chi tiết sản phẩm"
                >
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      crossOrigin="anonymous"
                      onError={e => { e.currentTarget.src = '/placeholder.png' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="fa-solid fa-image text-2xl text-gray-300"></i>
                    </div>
                  )}
                  {hasDiscount && (
                    <span className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      -{discountPct}%
                    </span>
                  )}
                </div>

                {/* Thông tin sản phẩm */}
                <div className="flex-1 min-w-0">
                  {/* Tên → click điều hướng */}
                  <h3
                    className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1 cursor-pointer hover:text-red-500 transition-colors"
                    onClick={() => navigate(`/products/${item.productSlug || item.productId}`)}
                  >
                    {item.productName}
                  </h3>

                  {/* Variant tags */}
                  {item.variantValues && Object.entries(item.variantValues).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {Object.entries(item.variantValues).map(([k, v]) => (
                        <span key={k} className="inline-block bg-gray-100 text-gray-500 text-[11px] px-2 py-0.5 rounded-md">
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* SKU */}
                  {item.sku && (
                    <p className="text-[11px] text-gray-400 mb-1">SKU: {item.sku}</p>
                  )}

                  {/* Giá */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-red-500 font-bold text-sm">{formatPrice(item.unitPrice)}</span>
                    {hasDiscount && (
                      <span className="text-gray-400 text-xs line-through">{formatPrice(item.originalPrice)}</span>
                    )}
                  </div>

                  {/* Tồn kho thấp */}
                  {isLowStock && item.maxStock > 0 && (
                    <p className="text-[11px] text-amber-600 bg-amber-50 px-2 py-1 rounded-md mt-1 inline-block">
                      <i className="fa-solid fa-bolt mr-1"></i>Còn {item.maxStock} sản phẩm
                    </p>
                  )}
                  {item.maxStock === 0 && (
                    <p className="text-[11px] text-red-500 bg-red-50 px-2 py-1 rounded-md mt-1 inline-block">
                      <i className="fa-solid fa-triangle-exclamation mr-1"></i>Hết hàng
                    </p>
                  )}
                </div>

                {/* Điều khiển số lượng + xóa */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleRemove(item.productId)}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1 -mt-1"
                    title="Xóa sản phẩm"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>

                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                      className="px-3 py-1.5 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      <i className="fa-solid fa-minus text-xs"></i>
                    </button>
                    <span className="px-4 py-1.5 text-sm font-bold border-x border-gray-200 min-w-[40px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="px-3 py-1.5 hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-30"
                    >
                      <i className="fa-solid fa-plus text-xs"></i>
                    </button>
                  </div>

                  <p className="text-sm font-bold text-gray-700">{formatPrice(item.subtotal)}</p>
                </div>
              </div>
            )
          })}

          <Link to="/products" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors mt-2">
            <i className="fa-solid fa-arrow-left"></i>Tiếp tục mua sắm
          </Link>
        </div>

        {/* ── Tóm tắt đơn hàng (Desktop) ── */}
        <div className="hidden lg:block">
          <OrderSummary
            selectedItems={selectedItems}
            selectedTotal={selectedTotal}
            shippingFee={shippingFee}
            finalAmount={finalAmount}
            selectedCount={selected.size}
            formatPrice={formatPrice}
            onCheckout={() => navigate('/checkout', { state: { selectedIds: [...selected] } })}
          />
        </div>
      </div>

      {/* ── Bottom bar (Mobile) ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex items-center gap-3 lg:hidden z-40 shadow-lg">
        <div className="flex-1">
          <p className="text-xs text-gray-400">
            {selected.size > 0 ? `Đã chọn ${selected.size} sản phẩm` : 'Chưa chọn sản phẩm nào'}
          </p>
          <p className="font-bold text-red-500 text-base">{formatPrice(finalAmount)}</p>
        </div>
        <button
          onClick={() => navigate('/checkout', { state: { selectedIds: [...selected] } })}
          disabled={selected.size === 0}
          className="btn-primary px-6 py-2.5 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <i className="fa-solid fa-lock text-sm"></i>
          Thanh toán ({selected.size})
        </button>
      </div>
    </div>
  )
}

// ─── Component tóm tắt (dùng lại cho Desktop) ────────────────────────────────
function OrderSummary({ selectedItems, selectedTotal, shippingFee, finalAmount, selectedCount, formatPrice, onCheckout }) {
  return (
    <div className="card p-6 h-fit sticky top-20">
      <h2 className="font-bold text-gray-800 mb-4 text-lg">Tóm tắt đơn hàng</h2>

      {/* Danh sách sản phẩm được chọn */}
      {selectedItems.length > 0 ? (
        <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
          {selectedItems.map(item => (
            <div key={item.productId} className="flex justify-between text-sm">
              <span className="text-gray-500 line-clamp-1 flex-1 mr-2">
                {item.productName} ×{item.quantity}
              </span>
              <span className="text-gray-700 flex-shrink-0">{formatPrice(item.subtotal)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4 mb-4 border-b border-gray-100">
          Chưa chọn sản phẩm nào
        </p>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Tạm tính</span>
          <span>{formatPrice(selectedTotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <i className="fa-solid fa-truck text-blue-400"></i>Phí vận chuyển
          </span>
          <span className={shippingFee === 0 && selectedTotal > 0 ? 'text-green-600 font-medium' : ''}>
            {selectedTotal === 0 ? '—' : shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
          </span>
        </div>
        {shippingFee > 0 && selectedTotal > 0 && (
          <p className="text-xs text-orange-500 bg-orange-50 rounded-lg px-3 py-2">
            <i className="fa-solid fa-circle-info mr-1"></i>
            Mua thêm {formatPrice(500000 - selectedTotal)} để được miễn phí ship
          </p>
        )}
      </div>

      <div className="flex justify-between font-bold text-gray-800 text-lg border-t border-gray-100 pt-4 mb-4">
        <span>Tổng cộng</span>
        <span className="text-red-500">{formatPrice(finalAmount)}</span>
      </div>

      <button
        onClick={onCheckout}
        disabled={selectedCount === 0}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <i className="fa-solid fa-lock"></i>
        Thanh toán {selectedCount > 0 ? `(${selectedCount} sản phẩm)` : ''}
      </button>
    </div>
  )
}