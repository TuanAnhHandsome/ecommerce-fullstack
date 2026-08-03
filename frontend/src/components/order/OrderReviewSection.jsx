/**
 * OrderReviewSection
 * Hiển thị danh sách sản phẩm để đánh giá sau khi nhận hàng.
 * Chỉ render khi status === 'DELIVERED'.
 */
export default function OrderReviewSection({ items, reviewedProductIds, onReview }) {
  return (
    <div className="card p-5">
      <h2 className="font-bold text-gray-700 mb-1 flex items-center gap-2">
        <i className="fa-solid fa-star text-amber-400"></i>Đánh giá sản phẩm
      </h2>
      <p className="text-xs text-gray-400 mb-4">
        Chia sẻ trải nghiệm để giúp người mua khác
      </p>

      <div className="space-y-2">
        {items?.map((item, i) => {
          const hasReviewed = reviewedProductIds.has(item.productId)

          return (
            <div
              key={item.id ?? item.orderItemId ?? i}
              className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0"
            >
              {/* Thumbnail */}
              <div className="w-11 h-11 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                {item.productImg
                  ? (
                    <img
                      src={item.productImg}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      alt={item.productName}
                    />
                  )
                  : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="fa-solid fa-image text-gray-300"></i>
                    </div>
                  )
                }
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 line-clamp-1">
                  {item.productName}
                </p>
                {item.variantName && (
                  <p className="text-xs text-gray-400">{item.variantName}</p>
                )}
              </div>

              {/* Action */}
              {hasReviewed ? (
                <span className="flex items-center gap-1.5 text-xs text-green-600
                  bg-green-50 px-3 py-1.5 rounded-full font-medium flex-shrink-0">
                  <i className="fa-solid fa-circle-check"></i>Đã đánh giá
                </span>
              ) : (
                <button
                  onClick={() => onReview(item)}
                  className="flex items-center gap-1.5 text-xs text-amber-600
                    bg-amber-50 hover:bg-amber-100 border border-amber-200
                    px-3 py-1.5 rounded-full font-medium transition-colors flex-shrink-0"
                >
                  <i className="fa-regular fa-star"></i>Đánh giá
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
