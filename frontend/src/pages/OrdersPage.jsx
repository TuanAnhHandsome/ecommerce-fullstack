import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { orderAPI } from '../services/api'

// ─── Giữ nguyên STATUS_CONFIG gốc ────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING:          { label: 'Chờ xử lý',      color: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400',    icon: 'fa-clock'         },
  AWAITING_PAYMENT: { label: 'Chờ thanh toán',  color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400',  icon: 'fa-credit-card'   },
  PAID:             { label: 'Đã thanh toán',    color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-400',    icon: 'fa-circle-check'  },
  PROCESSING:       { label: 'Đang xử lý',       color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400',  icon: 'fa-gear'          },
  SHIPPED:          { label: 'Đang giao',         color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400',  icon: 'fa-truck'         },
  DELIVERED:        { label: 'Đã giao',           color: 'bg-green-100 text-green-700',   dot: 'bg-green-400',   icon: 'fa-box-open'      },
  CANCELLED:        { label: 'Đã huỷ',            color: 'bg-red-100 text-red-600',       dot: 'bg-red-400',     icon: 'fa-ban'           },
  REFUNDED:         { label: 'Đã hoàn tiền',      color: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-300',    icon: 'fa-rotate-left'   },
}

// Pills filter — dựa trên tập status thực tế
const FILTER_KEYS = ['ALL', 'PENDING', 'AWAITING_PAYMENT', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
const FILTER_LABELS = { ALL: 'Tất cả', ...Object.fromEntries(FILTER_KEYS.slice(1).map(k => [k, STATUS_CONFIG[k]?.label])) }

const fmt      = (p) => new Intl.NumberFormat('vi-VN').format(p) + 'đ'
const fmtDate  = (d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

// ─── OrderCard ────────────────────────────────────────────────────────────────
function OrderCard({ order }) {
  const cfg          = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
  const previewItems = order.orderItems?.slice(0, 4) ?? []
  const extraCount   = Math.max(0, (order.orderItems?.length ?? 0) - 4)

  return (
    <Link
      to={`/orders/${order.id}`}
      className="card p-5 block hover:shadow-md transition-all duration-200 group"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3 gap-3">
        <div>
          <p className="font-bold text-gray-800 group-hover:text-red-500 transition-colors flex items-center gap-1.5">
            <i className="fa-solid fa-hashtag text-xs text-gray-400" />
            {order.orderCode}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <i className="fa-regular fa-calendar text-xs" />
            {fmtDate(order.createdAt)}
          </p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1.5 rounded-full flex items-center gap-1.5 flex-shrink-0 ${cfg.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* Product thumbnails */}
      {previewItems.length > 0 && (
        <div className="flex gap-2 mb-3">
          {previewItems.map((item, i) => (
            <div
              key={i}
              className="w-12 h-12 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden border border-gray-100"
            >
              {item.productImg
                ? <img src={item.productImg} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                : <div className="w-full h-full flex items-center justify-center">
                    <i className="fa-solid fa-image text-gray-300 text-sm" />
                  </div>
              }
            </div>
          ))}
          {extraCount > 0 && (
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xs font-semibold text-gray-400 flex-shrink-0">
              +{extraCount}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <i className="fa-solid fa-box-open text-xs" />
            {order.orderItems?.length} SP
          </span>
          {order.payment?.gateway && (
            <span className="flex items-center gap-1">
              <i className="fa-solid fa-wallet text-xs" />
              {order.payment.gateway}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p className="font-bold text-red-500 text-base">{fmt(order.finalAmount)}</p>
          <i className="fa-solid fa-chevron-right text-xs text-gray-300 group-hover:text-red-400 transition-colors" />
        </div>
      </div>
    </Link>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [page, setPage]         = useState(0)
  const [activeFilter, setFilter] = useState('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', page],
    queryFn: () => orderAPI.getMyOrders({ page, size: 20 }).then(r => r.data),
  })

  // Client-side filter
  const allOrders    = data?.content ?? []
  const displayed    = activeFilter === 'ALL'
    ? allOrders
    : allOrders.filter(o => o.status === activeFilter)

  const countOf = (key) => key === 'ALL'
    ? allOrders.length
    : allOrders.filter(o => o.status === key).length

  // ── Loading ──
  if (isLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="card p-5 animate-pulse">
          <div className="flex justify-between mb-3">
            <div className="h-4 bg-gray-200 rounded w-40" />
            <div className="h-6 bg-gray-200 rounded w-24" />
          </div>
          <div className="flex gap-2 mb-3">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="w-12 h-12 bg-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="h-3 bg-gray-200 rounded w-32" />
        </div>
      ))}
    </div>
  )

  // ── Empty (chưa có đơn nào) ──
  if (!allOrders.length) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <i className="fa-solid fa-box text-4xl text-gray-300" />
      </div>
      <h2 className="text-xl font-bold text-gray-700 mb-2">Chưa có đơn hàng nào</h2>
      <p className="text-gray-400 mb-6">Hãy mua sắm và đặt hàng đầu tiên của bạn!</p>
      <Link to="/products" className="btn-primary px-8 py-3 inline-flex items-center gap-2">
        <i className="fa-solid fa-bag-shopping" />Mua sắm ngay
      </Link>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <i className="fa-solid fa-box text-red-500" />
          Đơn hàng của tôi
        </h1>
        <span className="text-sm text-gray-400">{allOrders.length} đơn</span>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-4 px-4 scrollbar-none">
        {FILTER_KEYS.map(key => {
          const count    = countOf(key)
          const isActive = activeFilter === key
          const cfg      = STATUS_CONFIG[key]
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold
                border transition-all duration-200 whitespace-nowrap flex-shrink-0
                ${isActive
                  ? 'bg-red-500 text-white border-red-500 shadow-sm shadow-red-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-500'
                }
              `}
            >
              {cfg && (
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white/70' : cfg.dot}`} />
              )}
              {FILTER_LABELS[key]}
              {key !== 'ALL' && count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none
                  ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}
                `}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* List */}
      {displayed.length === 0 ? (
        <div className="text-center py-14">
          <i className="fa-solid fa-filter text-3xl text-gray-200 mb-3 block" />
          <p className="text-gray-400 text-sm">
            Không có đơn hàng nào ở trạng thái "{FILTER_LABELS[activeFilter]}"
          </p>
          <button
            onClick={() => setFilter('ALL')}
            className="mt-3 text-sm text-red-500 hover:underline"
          >
            Xem tất cả đơn hàng
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {/* Pagination — chỉ hiện khi ALL, vì filter là client-side */}
      {activeFilter === 'ALL' && data?.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center
                       disabled:opacity-30 hover:border-red-300 hover:text-red-500 transition-colors"
          >
            <i className="fa-solid fa-chevron-left text-xs" />
          </button>

          {[...Array(data.totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors
                ${page === i
                  ? 'bg-red-500 text-white'
                  : 'border border-gray-200 hover:border-red-300 hover:text-red-500'
                }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))}
            disabled={page === data.totalPages - 1}
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center
                       disabled:opacity-30 hover:border-red-300 hover:text-red-500 transition-colors"
          >
            <i className="fa-solid fa-chevron-right text-xs" />
          </button>
        </div>
      )}

    </div>
  )
}