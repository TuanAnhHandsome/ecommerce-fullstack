import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orderAPI, paymentAPI, reviewAPI } from '../services/api'
import { useState } from 'react'
import toast from 'react-hot-toast'
import ReviewModal   from '../components/common/ReviewModal'    
import WarrantyModal from '../components/common/WarrantyModal'  
import ReturnModal   from '../components/common/ReturnModal'    

const STATUS_CONFIG = {
  PENDING:          { label:'Chờ xử lý',      color:'bg-gray-100 text-gray-600',    icon:'fa-clock',        step:0 },
  AWAITING_PAYMENT: { label:'Chờ thanh toán', color:'bg-yellow-100 text-yellow-700',icon:'fa-credit-card',  step:1 },
  PAID:             { label:'Đã thanh toán',   color:'bg-blue-100 text-blue-700',    icon:'fa-circle-check', step:2 },
  PROCESSING:       { label:'Đang xử lý',      color:'bg-purple-100 text-purple-700',icon:'fa-gear',         step:3 },
  SHIPPED:          { label:'Đang giao',        color:'bg-orange-100 text-orange-700',icon:'fa-truck',        step:4 },
  DELIVERED:        { label:'Đã giao',          color:'bg-green-100 text-green-700',  icon:'fa-box-open',     step:5 },
  CANCELLED:        { label:'Đã huỷ',           color:'bg-red-100 text-red-600',      icon:'fa-ban',          step:-1 },
  REFUNDED:         { label:'Đã hoàn tiền',     color:'bg-gray-100 text-gray-600',    icon:'fa-rotate-left',  step:-1 },
}

const STEPS = [
  { label:'Đặt hàng',   icon:'fa-cart-shopping' },
  { label:'Chờ TT',     icon:'fa-credit-card' },
  { label:'Đã TT',      icon:'fa-circle-check' },
  { label:'Xử lý',      icon:'fa-gear' },
  { label:'Giao hàng',  icon:'fa-truck' },
  { label:'Hoàn thành', icon:'fa-box-open' },
]

const CANCEL_REASONS = [
  'Tôi muốn thay đổi địa chỉ giao hàng',
  'Tôi muốn thay đổi sản phẩm/số lượng',
  'Tìm được giá rẻ hơn ở nơi khác',
  'Đặt nhầm sản phẩm',
  'Không còn nhu cầu mua nữa',
  'Lý do khác',
]

export default function OrderDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()

  // ── State ─────────────────────────────────────────────────────
  const [payLoading, setPayLoading]           = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason]       = useState('')
  const [customReason, setCustomReason]       = useState('')
  const [reviewTarget, setReviewTarget]       = useState(null)  // [MỚI]
  const [showWarranty, setShowWarranty]       = useState(false) // [MỚI]
  const [showReturn, setShowReturn]           = useState(false) // [MỚI]

  // ── Queries ───────────────────────────────────────────────────
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderAPI.getById(id).then(r => r.data),
  })

  // [MỚI] Set<productId> đã review trong order này
  const { data: reviewedProductIds = new Set() } = useQuery({
    queryKey: ['reviewedProducts', id],
    queryFn: () =>
      reviewAPI.getReviewedProducts(id).then(r => new Set(r.data)),
    enabled: order?.status === 'DELIVERED',
  })

  const isDelivered = order?.status === 'DELIVERED'

  // ── Cancel mutation ───────────────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: () => {
      const reason = cancelReason === 'Lý do khác' ? customReason : cancelReason
      return orderAPI.cancel(order.id, reason)
    },
    onSuccess: () => {
      toast.success('Đã hủy đơn hàng thành công')
      setShowCancelModal(false)
      setCancelReason('')
      setCustomReason('')
      queryClient.invalidateQueries(['order', id])
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Không thể hủy đơn hàng')
    },
  })

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p) + 'đ'
  const formatDate  = (d) => new Date(d).toLocaleString('vi-VN')

  const handleRetryPayment = async () => {
    setPayLoading(true)
    try {
      const { data: payment } = await paymentAPI.createVNPay(order.id)
      window.location.href = payment.paymentUrl
    } catch { toast.error('Không thể tạo link thanh toán') }
    finally { setPayLoading(false) }
  }

  const handleCloseCancel = () => {
    setShowCancelModal(false)
    setCancelReason('')
    setCustomReason('')
  }

  const canCancel = order &&
    ['PENDING', 'AWAITING_PAYMENT', 'PROCESSING'].includes(order.status)

  const isSubmitDisabled =
    !cancelReason ||
    (cancelReason === 'Lý do khác' && !customReason.trim()) ||
    cancelMutation.isPending

  // ── Loading / Not found ───────────────────────────────────────
  if (isLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse space-y-4">
      <div className="h-6 bg-gray-200 rounded w-48"></div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="card p-6 h-32 bg-gray-100"></div>
      ))}
    </div>
  )

  if (!order) return (
    <div className="text-center py-20">
      <i className="fa-solid fa-circle-exclamation text-4xl text-gray-300 mb-3 block"></i>
      <p className="text-gray-500">Không tìm thấy đơn hàng</p>
    </div>
  )

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
  const currentStep = cfg.step

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link to="/orders"
            className="text-sm text-gray-400 hover:text-red-500 flex items-center gap-1 mb-2">
            <i className="fa-solid fa-arrow-left"></i>Đơn hàng của tôi
          </Link>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-hashtag text-gray-400 text-base"></i>{order.orderCode}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2 ${cfg.color}`}>
            <i className={`fa-solid ${cfg.icon}`}></i>{cfg.label}
          </span>
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="text-sm text-red-500 border border-red-200 hover:bg-red-50
                         rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors">
              <i className="fa-solid fa-ban"></i>Hủy đơn
            </button>
          )}
        </div>
      </div>

      {/* ── Cancel info ───────────────────────────────────────────── */}
      {(order.status === 'CANCELLED' || order.status === 'REFUNDED') && order.cancelReason && (
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
      )}

      {/* ── Progress bar ──────────────────────────────────────────── */}
      {currentStep >= 0 && (
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    i <= currentStep
                      ? 'bg-red-500 text-white shadow-sm shadow-red-200'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    <i className={`fa-solid ${step.icon} text-xs`}></i>
                  </div>
                  <p className={`text-xs mt-1.5 font-medium ${
                    i <= currentStep ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-4 transition-all ${
                    i < currentStep ? 'bg-red-400' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Retry payment ─────────────────────────────────────────── */}
      {order.status === 'AWAITING_PAYMENT' && order.payment?.gateway === 'VNPAY' && (
        <div className="card p-4 mb-4 bg-yellow-50 border-yellow-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-700">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <p className="text-sm font-medium">Đơn hàng chưa được thanh toán</p>
          </div>
          <button onClick={handleRetryPayment} disabled={payLoading}
            className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
            {payLoading
              ? <><i className="fa-solid fa-spinner fa-spin"></i>Đang xử lý...</>
              : <><i className="fa-solid fa-credit-card"></i>Thanh toán ngay</>
            }
          </button>
        </div>
      )}

      <div className="space-y-4">

        {/* ── Products ──────────────────────────────────────────── */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-box text-gray-400"></i>Sản phẩm đã đặt
          </h2>
          <div className="space-y-3">
            {order.orderItems?.map((item, i) => (
              <div key={item.id ?? item.orderItemId ?? i}
                className="flex gap-3 items-center py-2 border-b border-gray-50 last:border-0">
                <div className="w-14 h-14 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                  {item.productImg
                    ? <img src={item.productImg} className="w-full h-full object-cover"
                           crossOrigin="anonymous" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <i className="fa-solid fa-image text-gray-300 text-xl"></i>
                      </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                    {item.productName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatPrice(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <p className="font-bold text-gray-700 flex-shrink-0">
                  {formatPrice(item.subtotal)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            [MỚI] Section Đánh giá — chỉ hiện khi DELIVERED
        ══════════════════════════════════════════════════════════ */}
        {isDelivered && (
          <div className="card p-5">
            <h2 className="font-bold text-gray-700 mb-1 flex items-center gap-2">
              <i className="fa-solid fa-star text-amber-400"></i>Đánh giá sản phẩm
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Chia sẻ trải nghiệm để giúp người mua khác
            </p>
            <div className="space-y-2">
              {order.orderItems?.map((item, i) => {
                const hasReviewed = reviewedProductIds.has(item.productId)
                return (
                  <div key={item.id ?? item.orderItemId ?? i}
                    className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <div className="w-11 h-11 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {item.productImg
                        ? <img src={item.productImg} className="w-full h-full object-cover"
                               crossOrigin="anonymous" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <i className="fa-solid fa-image text-gray-300"></i>
                          </div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">
                        {item.productName}
                      </p>
                      {item.variantName && (
                        <p className="text-xs text-gray-400">{item.variantName}</p>
                      )}
                    </div>
                    {hasReviewed ? (
                      <span className="flex items-center gap-1.5 text-xs text-green-600
                                       bg-green-50 px-3 py-1.5 rounded-full font-medium
                                       flex-shrink-0">
                        <i className="fa-solid fa-circle-check"></i>Đã đánh giá
                      </span>
                    ) : (
                      <button
                        onClick={() => setReviewTarget(item)}
                        className="flex items-center gap-1.5 text-xs text-amber-600
                                   bg-amber-50 hover:bg-amber-100 border border-amber-200
                                   px-3 py-1.5 rounded-full font-medium transition-colors
                                   flex-shrink-0">
                        <i className="fa-regular fa-star"></i>Đánh giá
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            [MỚI] Section Bảo hành + Hoàn hàng — chỉ hiện khi DELIVERED
        ══════════════════════════════════════════════════════════ */}
        {isDelivered && (
          <div className="card p-5">
            <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
              <i className="fa-solid fa-headset text-gray-400"></i>Hỗ trợ sau mua hàng
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {/* Bảo hành */}
              <button
                onClick={() => setShowWarranty(true)}
                className="flex flex-col items-center gap-2 p-4 border border-blue-200
                           bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 group-hover:bg-blue-200
                                flex items-center justify-center transition-colors">
                  <i className="fa-solid fa-shield-halved text-blue-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-blue-700">Bảo hành / Sửa chữa</p>
                  <p className="text-xs text-blue-500 mt-0.5">Sản phẩm gặp sự cố kỹ thuật</p>
                </div>
              </button>

              {/* Hoàn hàng */}
              <button
                onClick={() => setShowReturn(true)}
                className="flex flex-col items-center gap-2 p-4 border border-red-200
                           bg-red-50 hover:bg-red-100 rounded-xl transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-red-100 group-hover:bg-red-200
                                flex items-center justify-center transition-colors">
                  <i className="fa-solid fa-rotate-left text-red-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-red-700">Hoàn hàng / Hoàn tiền</p>
                  <p className="text-xs text-red-500 mt-0.5">Đổi trả trong 7 ngày</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── Shipping & Payment ────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      {/* ── Cancel Modal ──────────────────────────────────────────── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center
                        bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
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
              Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.
            </p>
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
                    <span className="text-sm text-gray-600 group-hover:text-gray-800
                                     transition-colors">
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
            <div className="flex gap-2.5">
              <button
                onClick={handleCloseCancel}
                disabled={cancelMutation.isPending}
                className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5
                           text-sm font-medium hover:bg-gray-50 transition-colors
                           disabled:opacity-50">
                Giữ đơn hàng
              </button>
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={isSubmitDisabled}
                className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm
                           font-medium hover:bg-red-600 disabled:opacity-50
                           disabled:cursor-not-allowed transition-colors
                           flex items-center justify-center gap-2">
                {cancelMutation.isPending
                  ? <><i className="fa-solid fa-spinner fa-spin"></i>Đang xử lý...</>
                  : <><i className="fa-solid fa-ban"></i>Xác nhận hủy</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── [MỚI] Review Modal ────────────────────────────────────── */}
      {reviewTarget && (
        <ReviewModal
          item={reviewTarget}
          orderId={order.id}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => setReviewTarget(null)}
        />
      )}

      {/* ── [MỚI] Warranty Modal ─────────────────────────────────── */}
      {showWarranty && (
        <WarrantyModal
          order={order}
          onClose={() => setShowWarranty(false)}
        />
      )}

      {/* ── [MỚI] Return Modal ───────────────────────────────────── */}
      {showReturn && (
        <ReturnModal
          order={order}
          onClose={() => setShowReturn(false)}
        />
      )}
    </div>
  )
}