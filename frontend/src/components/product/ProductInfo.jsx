import StarRating from './StarRating'

const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p) + 'đ'

export default function ProductInfo({
  product,
  currentPrice, originalPrice, salePrice, isOnSale, discountPct,
  currentStock,
  selectedValues, handleSelectValue,
  qty, setQty,
  handleAddToCart,
  onBuyNow,
  buyNowLoading = false,
}) {
  return (
    <div>
      {/* Badges */}
      <div className="flex gap-2 flex-wrap mb-3">
        <span className="text-xs font-medium text-red-500 bg-red-50 px-2.5 py-1 rounded-full">
          <i className="fa-solid fa-tag mr-1"></i>{product.categoryName}
        </span>
        {currentStock > 0
          ? <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              <i className="fa-solid fa-circle-check mr-1"></i>Còn hàng
            </span>
          : <span className="text-xs font-medium text-red-500 bg-red-50 px-2.5 py-1 rounded-full">
              <i className="fa-solid fa-circle-xmark mr-1"></i>Hết hàng
            </span>
        }
        {product.soldCount > 0 && (
          <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
            <i className="fa-solid fa-fire mr-1"></i>{product.soldCount.toLocaleString()} đã bán
          </span>
        )}
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-2 leading-snug">{product.name}</h1>

      {/* Rating */}
      {product.avgRating > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <StarRating rating={product.avgRating} />
          <span className="text-sm font-semibold text-amber-600">{product.avgRating}</span>
          <span className="text-sm text-gray-400">({product.reviewCount} đánh giá)</span>
        </div>
      )}

      {product.sku && <p className="text-xs text-gray-400 mb-4">SKU: {product.sku}</p>}

      {/* Price */}
      <div className="bg-gray-50 rounded-xl p-4 mb-5">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-3xl font-bold text-red-500">{formatPrice(currentPrice)}</span>
          {isOnSale && (
            <>
              <span className="text-lg text-gray-400 line-through">{formatPrice(originalPrice)}</span>
              <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-0.5 rounded-full">
                -{discountPct}%
              </span>
            </>
          )}
        </div>
        {isOnSale && (
          <p className="text-xs text-green-600 mt-1 font-medium">
            Tiết kiệm {formatPrice(originalPrice - salePrice)}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">Giá đã bao gồm VAT</p>
      </div>

      {/* Variants */}
      {product.variantOptions?.map(opt => (
        <div key={opt.id} className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {opt.name}:
            {selectedValues[opt.name]
              ? <span className="ml-2 text-red-500">{selectedValues[opt.name]}</span>
              : <span className="ml-2 text-gray-400 font-normal text-xs">Chưa chọn</span>
            }
          </p>
          <div className="flex gap-2 flex-wrap">
            {opt.values.map(val => {
              const isSelected = selectedValues[opt.name] === val.value
              const hasStock = product.variants?.some(v =>
                v.valueLabels?.includes(val.value) && v.stockQty > 0 && v.active
              )
              return (
                <button
                  key={val.id}
                  onClick={() => handleSelectValue(opt.name, val.value)}
                  disabled={!hasStock}
                  className={`px-4 py-2 text-sm rounded-xl border-2 transition-all font-medium ${
                    isSelected
                      ? 'border-red-500 bg-red-50 text-red-600'
                      : hasStock
                        ? 'border-gray-200 hover:border-gray-300 text-gray-700'
                        : 'border-gray-100 text-gray-300 cursor-not-allowed line-through'
                  }`}
                >
                  {val.value}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Low stock warning */}
      {currentStock > 0 && currentStock <= 10 && (
        <p className="text-xs text-orange-500 mb-3 font-medium">
          <i className="fa-solid fa-triangle-exclamation mr-1"></i>
          Chỉ còn {currentStock} sản phẩm
        </p>
      )}

      {/* Qty + CTA */}
      {currentStock > 0 && (
        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-20">Số lượng:</span>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="px-4 py-2.5 hover:bg-gray-50 text-gray-600 font-bold transition-colors"
              >
                <i className="fa-solid fa-minus text-xs"></i>
              </button>
              <span className="px-5 py-2.5 text-sm font-bold border-x border-gray-200 min-w-[48px] text-center">
                {qty}
              </span>
              <button
                onClick={() => setQty(q => Math.min(currentStock, q + 1))}
                className="px-4 py-2.5 hover:bg-gray-50 text-gray-600 font-bold transition-colors"
              >
                <i className="fa-solid fa-plus text-xs"></i>
              </button>
            </div>
            <span className="text-xs text-gray-400">Còn {currentStock}</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={buyNowLoading}
              className="btn-secondary flex-1 py-3 flex items-center justify-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-cart-plus"></i>Thêm vào giỏ
            </button>
            <button
              onClick={onBuyNow}
              disabled={buyNowLoading}
              className="btn-primary flex-1 py-3 flex items-center justify-center gap-2
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {buyNowLoading
                ? <><i className="fa-solid fa-spinner fa-spin"></i>Đang xử lý...</>
                : <><i className="fa-solid fa-bolt text-yellow-300"></i>Mua ngay</>
              }
            </button>
          </div>
        </div>
      )}

      {/* Policies */}
      <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
        {[
          { icon: 'fa-truck',         color: 'text-blue-500',   text: 'Miễn ship từ 500k' },
          { icon: 'fa-shield-halved', color: 'text-green-500',  text: 'Bảo hành 12 tháng' },
          { icon: 'fa-rotate-left',   color: 'text-orange-500', text: 'Đổi trả 7 ngày' },
          { icon: 'fa-credit-card',   color: 'text-purple-500', text: 'Trả góp 0%' },
        ].map(p => (
          <div key={p.text} className="flex items-center gap-2 text-xs text-gray-500">
            <i className={`fa-solid ${p.icon} ${p.color} w-4`}></i>
            {p.text}
          </div>
        ))}
      </div>
    </div>
  )
}