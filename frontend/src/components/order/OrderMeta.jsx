import { formatPrice, formatDate } from './orderConstants'

/**
 * OrderMeta
 * Hai card: Thông tin giao hàng + Thông tin thanh toán / tổng tiền.
 */
export default function OrderMeta({ order }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* ── Shipping ──────────────────────────────────────────── */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-location-dot text-red-400"></i>Thông tin giao hàng
        </h2>

        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <i className="fa-solid fa-user text-gray-300 w-4 mt-0.5"></i>
            <span className="text-gray-700 font-medium">{order.shippingName}</span>
          </div>
          <div className="flex gap-2">
            <i className="fa-solid fa-phone text-gray-300 w-4 mt-0.5"></i>
            <span className="text-gray-600">{order.shippingPhone}</span>
          </div>
          <div className="flex gap-2">
            <i className="fa-solid fa-map-pin text-gray-300 w-4 mt-0.5"></i>
            <span className="text-gray-600">{order.shippingAddress}</span>
          </div>
          {order.note && (
            <div className="flex gap-2">
              <i className="fa-solid fa-note-sticky text-gray-300 w-4 mt-0.5"></i>
              <span className="text-gray-500 italic">{order.note}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Payment ───────────────────────────────────────────── */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-receipt text-blue-400"></i>Thanh toán
        </h2>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Phương thức</span>
            <span className="font-medium">{order.payment?.gateway || '—'}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Trạng thái</span>
            <span className={`font-semibold ${
              order.payment?.status === 'SUCCESS' ? 'text-green-600' : 'text-gray-600'
            }`}>
              {order.payment?.status === 'SUCCESS'
                ? '✓ Đã thanh toán'
                : order.payment?.status || '—'}
            </span>
          </div>

          {order.payment?.paidAt && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Thời gian TT</span>
              <span className="text-gray-600">{formatDate(order.payment.paidAt)}</span>
            </div>
          )}

          {/* Tổng cộng */}
          <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Tạm tính</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Phí ship</span>
              <span className={order.shippingFee == 0 ? 'text-green-600' : ''}>
                {order.shippingFee == 0 ? 'Miễn phí' : formatPrice(order.shippingFee)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-gray-800">
              <span>Tổng cộng</span>
              <span className="text-red-500 text-lg">
                {formatPrice(order.finalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
