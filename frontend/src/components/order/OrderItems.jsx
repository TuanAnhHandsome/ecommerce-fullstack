import { formatPrice } from './orderConstants'

/**
 * OrderItems
 * Danh sách sản phẩm trong đơn hàng.
 */
export default function OrderItems({ items }) {
  return (
    <div className="card p-5">
      <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
        <i className="fa-solid fa-box text-gray-400"></i>Sản phẩm đã đặt
      </h2>

      <div className="space-y-3">
        {items?.map((item, i) => (
          <div
            key={item.id ?? item.orderItemId ?? i}
            className="flex gap-3 items-center py-2 border-b border-gray-50 last:border-0"
          >
            {/* Thumbnail */}
            <div className="w-14 h-14 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
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
                    <i className="fa-solid fa-image text-gray-300 text-xl"></i>
                  </div>
                )
              }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                {item.productName}
              </p>
              <p className="text-xs text-gray-400">
                {formatPrice(item.unitPrice)} × {item.quantity}
              </p>
            </div>

            {/* Subtotal */}
            <p className="font-bold text-gray-700 flex-shrink-0">
              {formatPrice(item.subtotal)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
