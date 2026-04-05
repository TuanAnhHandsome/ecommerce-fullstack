import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { orderAPI, paymentAPI } from '../services/api'
import { useState } from 'react'
import toast from 'react-hot-toast'

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

export default function OrderDetailPage() {
  const { id } = useParams()
  const [payLoading, setPayLoading] = useState(false)

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderAPI.getById(id).then(r => r.data),
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

  if (isLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse space-y-4">
      <div className="h-6 bg-gray-200 rounded w-48"></div>
      {[...Array(3)].map((_, i) => <div key={i} className="card p-6 h-32 bg-gray-100"></div>)}
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
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link to="/orders" className="text-sm text-gray-400 hover:text-red-500 flex items-center gap-1 mb-2">
            <i className="fa-solid fa-arrow-left"></i>Đơn hàng của tôi
          </Link>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-hashtag text-gray-400 text-base"></i>{order.orderCode}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2 ${cfg.color}`}>
          <i className={`fa-solid ${cfg.icon}`}></i>{cfg.label}
        </span>
      </div>

      {/* Progress bar (ẩn khi huỷ/hoàn tiền) */}
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
                  <p className={`text-xs mt-1.5 font-medium ${i <= currentStep ? 'text-red-500' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-4 transition-all ${i < currentStep ? 'bg-red-400' : 'bg-gray-200'}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Retry payment button */}
      {order.status === 'AWAITING_PAYMENT' && order.payment?.gateway === 'VNPAY' && (
        <div className="card p-4 mb-4 bg-yellow-50 border-yellow-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-700">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <p className="text-sm font-medium">Đơn hàng chưa được thanh toán</p>
          </div>
          <button onClick={handleRetryPayment} disabled={payLoading}
            className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
            {payLoading ? <><i className="fa-solid fa-spinner fa-spin"></i>Đang xử lý...</> : <><i className="fa-solid fa-credit-card"></i>Thanh toán ngay</>}
          </button>
        </div>
      )}

      <div className="space-y-4">
        {/* Products */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-box text-gray-400"></i>Sản phẩm đã đặt
          </h2>
          <div className="space-y-3">
            {order.orderItems?.map((item, i) => (
              <div key={i} className="flex gap-3 items-center py-2 border-b border-gray-50 last:border-0">
                <div className="w-14 h-14 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                  {item.productImg
                    ? <img src={item.productImg} className="w-full h-full object-cover" crossOrigin="anonymous" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <i className="fa-solid fa-image text-gray-300 text-xl"></i>
                      </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">{item.productName}</p>
                  <p className="text-xs text-gray-400">
                    {formatPrice(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <p className="font-bold text-gray-700 flex-shrink-0">{formatPrice(item.subtotal)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Shipping */}
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

          {/* Payment */}
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
                <span className={`font-semibold ${order.payment?.status === 'SUCCESS' ? 'text-green-600' : 'text-gray-600'}`}>
                  {order.payment?.status === 'SUCCESS' ? '✓ Đã thanh toán' : order.payment?.status || '—'}
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
                  <span>Tạm tính</span><span>{formatPrice(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Phí ship</span>
                  <span className={order.shippingFee == 0 ? 'text-green-600' : ''}>
                    {order.shippingFee == 0 ? 'Miễn phí' : formatPrice(order.shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-gray-800">
                  <span>Tổng cộng</span>
                  <span className="text-red-500 text-lg">{formatPrice(order.finalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}