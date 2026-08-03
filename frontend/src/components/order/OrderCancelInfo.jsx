import { formatDate } from './orderConstants'

/**
 * OrderCancelInfo
 * Banner hiển thị lý do + thời gian hủy đơn.
 * Chỉ render khi status là CANCELLED hoặc REFUNDED và có cancelReason.
 */
export default function OrderCancelInfo({ order }) {
  const show =
    (order.status === 'CANCELLED' || order.status === 'REFUNDED') &&
    order.cancelReason

  if (!show) return null

  return (
    <div className="card p-4 mb-4 bg-red-50 border border-red-100">
      <p className="text-sm font-semibold text-red-600 flex items-center gap-2 mb-1">
        <i className="fa-solid fa-circle-info"></i>Lý do hủy đơn
      </p>
      <p className="text-sm text-red-500">{order.cancelReason}</p>
      {order.cancelledAt && (
        <p className="text-xs text-red-400 mt-1">
          Hủy lúc: {formatDate(order.cancelledAt)}
        </p>
      )}
    </div>
  )
}
