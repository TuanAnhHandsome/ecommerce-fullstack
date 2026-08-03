import { useState } from 'react'
import { CANCEL_REASONS } from './orderConstants'

/**
 * OrderCancelModal
 * Modal xác nhận hủy đơn + chọn lý do.
 * Props:
 *   order      — dữ liệu đơn hàng
 *   onClose    — đóng modal (không hủy)
 *   onConfirm  — callback(reason: string) khi xác nhận
 *   isPending  — mutation đang chạy
 */
export default function OrderCancelModal({ order, onClose, onConfirm, isPending }) {
  const [cancelReason, setCancelReason] = useState('')
  const [customReason, setCustomReason] = useState('')

  const isSubmitDisabled =
    !cancelReason ||
    (cancelReason === 'Lý do khác' && !customReason.trim()) ||
    isPending

  const handleConfirm = () => {
    const reason = cancelReason === 'Lý do khác' ? customReason : cancelReason
    onConfirm(reason)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center
      bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center
            justify-center flex-shrink-0">
            <i className="fa-solid fa-triangle-exclamation text-red-500"></i>
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Xác nhận hủy đơn hàng</h3>
            <p className="text-sm text-gray-400">#{order.orderCode}</p>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Bạn có chắc chắn muốn hủy đơn hàng này không?
          Hành động này không thể hoàn tác.
        </p>

        {/* Reasons */}
        <div className="mb-5">
          <p className="text-sm font-semibold text-gray-700 mb-2.5">
            Vui lòng chọn lý do hủy <span className="text-red-500">*</span>
          </p>

          <div className="space-y-2">
            {CANCEL_REASONS.map((r) => (
              <label key={r} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="cancelReason"
                  value={r}
                  checked={cancelReason === r}
                  onChange={(e) => {
                    setCancelReason(e.target.value)
                    setCustomReason('')
                  }}
                  className="accent-red-500 w-4 h-4 flex-shrink-0"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                  {r}
                </span>
              </label>
            ))}
          </div>

          {cancelReason === 'Lý do khác' && (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="mt-3 w-full border border-gray-200 rounded-xl p-3 text-sm
                focus:outline-none focus:ring-2 focus:ring-red-200
                focus:border-red-300 resize-none transition-all"
              rows={3}
              placeholder="Nhập lý do cụ thể của bạn..."
              maxLength={200}
            />
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5
              text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Giữ đơn hàng
          </button>

          <button
            onClick={handleConfirm}
            disabled={isSubmitDisabled}
            className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm
              font-medium hover:bg-red-600 disabled:opacity-50
              disabled:cursor-not-allowed transition-colors
              flex items-center justify-center gap-2"
          >
            {isPending
              ? <><i className="fa-solid fa-spinner fa-spin"></i>Đang xử lý...</>
              : <><i className="fa-solid fa-ban"></i>Xác nhận hủy</>
            }
          </button>
        </div>

      </div>
    </div>
  )
}
