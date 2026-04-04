import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { orderAPI } from '../services/api'

const STATUS_CONFIG = {
  PENDING:           { label: 'Chờ xử lý',       color: 'bg-gray-100 text-gray-600',    icon: 'fa-clock' },
  AWAITING_PAYMENT:  { label: 'Chờ thanh toán',   color: 'bg-yellow-100 text-yellow-700',icon: 'fa-credit-card' },
  PAID:              { label: 'Đã thanh toán',     color: 'bg-blue-100 text-blue-700',    icon: 'fa-circle-check' },
  PROCESSING:        { label: 'Đang xử lý',        color: 'bg-purple-100 text-purple-700',icon: 'fa-gear' },
  SHIPPED:           { label: 'Đang giao',         color: 'bg-orange-100 text-orange-700',icon: 'fa-truck' },
  DELIVERED:         { label: 'Đã giao',           color: 'bg-green-100 text-green-700',  icon: 'fa-box-open' },
  CANCELLED:         { label: 'Đã huỷ',            color: 'bg-red-100 text-red-600',      icon: 'fa-ban' },
  REFUNDED:          { label: 'Đã hoàn tiền',      color: 'bg-gray-100 text-gray-600',    icon: 'fa-rotate-left' },
}

export default function OrdersPage() {
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', page],
    queryFn: () => orderAPI.getMyOrders({ page, size: 10 }).then(r => r.data),
  })

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p) + 'đ'
  const formatDate  = (d) => new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' })

  if (isLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card p-6 animate-pulse">
          <div className="flex justify-between mb-3">
            <div className="h-4 bg-gray-200 rounded w-40"></div>
            <div className="h-6 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
        </div>
      ))}
    </div>
  )

  if (!data?.content?.length) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <i className="fa-solid fa-box text-4xl text-gray-300"></i>
      </div>
      <h2 className="text-xl font-bold text-gray-700 mb-2">Chưa có đơn hàng nào</h2>
      <p className="text-gray-400 mb-6">Hãy mua sắm và đặt hàng đầu tiên của bạn!</p>
      <Link to="/products" className="btn-primary px-8 py-3 inline-flex items-center gap-2">
        <i className="fa-solid fa-bag-shopping"></i>Mua sắm ngay
      </Link>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <i className="fa-solid fa-box text-red-500"></i>Đơn hàng của tôi
      </h1>

      <div className="space-y-4">
        {data.content.map(order => {
          const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
          return (
            <Link key={order.id} to={`/orders/${order.id}`}
              className="card p-5 block hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-gray-800 group-hover:text-red-500 transition-colors flex items-center gap-2">
                    <i className="fa-solid fa-hashtag text-xs text-gray-400"></i>
                    {order.orderCode}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <i className="fa-regular fa-calendar"></i>{formatDate(order.createdAt)}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${cfg.color}`}>
                  <i className={`fa-solid ${cfg.icon}`}></i>{cfg.label}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <i className="fa-solid fa-box-open text-xs"></i>
                    {order.orderItems?.length} sản phẩm
                  </span>
                  {order.payment && (
                    <span className="flex items-center gap-1">
                      <i className="fa-solid fa-wallet text-xs"></i>
                      {order.payment.gateway}
                    </span>
                  )}
                </div>
                <p className="font-bold text-red-500 text-lg">{formatPrice(order.finalAmount)}</p>
              </div>

              <div className="mt-3 flex items-center justify-end text-xs text-gray-400 group-hover:text-red-400 transition-colors">
                Xem chi tiết <i className="fa-solid fa-chevron-right ml-1"></i>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Pagination */}
      {data?.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page===0}
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:border-red-300 hover:text-red-500">
            <i className="fa-solid fa-chevron-left text-xs"></i>
          </button>
          {[...Array(data.totalPages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={`w-9 h-9 rounded-lg text-sm font-medium ${page===i ? 'bg-red-500 text-white' : 'border border-gray-200 hover:border-red-300 hover:text-red-500'}`}>
              {i+1}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(data.totalPages-1, p+1))} disabled={page===data.totalPages-1}
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:border-red-300 hover:text-red-500">
            <i className="fa-solid fa-chevron-right text-xs"></i>
          </button>
        </div>
      )}
    </div>
  )
}