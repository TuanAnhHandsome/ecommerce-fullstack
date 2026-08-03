import { Link } from 'react-router-dom'
import { STATUS_CONFIG, formatDate } from './orderConstants'

/**
 * OrderHeader
 * Hiển thị: breadcrumb, mã đơn, ngày tạo, badge trạng thái, nút hủy đơn
 */
export default function OrderHeader({ order, onCancelClick }) {
  const cfg       = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
  const canCancel = ['PENDING', 'AWAITING_PAYMENT', 'PROCESSING'].includes(order.status)

  return (
    <div className="flex items-start justify-between mb-6">
      {/* Left */}
      <div>
        <Link
          to="/orders"
          className="text-sm text-gray-400 hover:text-red-500 flex items-center gap-1 mb-2"
        >
          <i className="fa-solid fa-arrow-left"></i>Đơn hàng của tôi
        </Link>
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <i className="fa-solid fa-hashtag text-gray-400 text-base"></i>
          {order.orderCode}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
      </div>

      {/* Right */}
      <div className="flex flex-col items-end gap-2">
        <span className={`text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2 ${cfg.color}`}>
          <i className={`fa-solid ${cfg.icon}`}></i>{cfg.label}
        </span>

        {canCancel && (
          <button
            onClick={onCancelClick}
            className="text-sm text-red-500 border border-red-200 hover:bg-red-50
              rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors"
          >
            <i className="fa-solid fa-ban"></i>Hủy đơn
          </button>
        )}
      </div>
    </div>
  )
}
