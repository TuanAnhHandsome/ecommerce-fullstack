/**
 * OrderRetryPayment
 * Banner nhắc thanh toán lại cho đơn VNPAY chưa thanh toán.
 * Chỉ render khi status === 'AWAITING_PAYMENT' và gateway === 'VNPAY'.
 */
export default function OrderRetryPayment({ order, loading, onRetry }) {
  const show =
    order.status === 'AWAITING_PAYMENT' &&
    order.payment?.gateway === 'VNPAY'

  if (!show) return null

  return (
    <div className="card p-4 mb-4 bg-yellow-50 border border-yellow-200
      flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-yellow-700">
        <i className="fa-solid fa-triangle-exclamation"></i>
        <p className="text-sm font-medium">Đơn hàng chưa được thanh toán</p>
      </div>

      <button
        onClick={onRetry}
        disabled={loading}
        className="btn-primary text-sm py-2 px-4 flex items-center gap-2 flex-shrink-0"
      >
        {loading
          ? <><i className="fa-solid fa-spinner fa-spin"></i>Đang xử lý...</>
          : <><i className="fa-solid fa-credit-card"></i>Thanh toán ngay</>
        }
      </button>
    </div>
  )
}
