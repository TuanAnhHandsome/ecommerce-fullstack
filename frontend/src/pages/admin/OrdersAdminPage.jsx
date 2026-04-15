import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { orderAPI } from '../../services/api'
import toast from 'react-hot-toast'

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING:          { label:'Chờ xử lý',      color:'bg-gray-100 text-gray-600',      icon:'fa-clock',        step: 0 },
  AWAITING_PAYMENT: { label:'Chờ thanh toán', color:'bg-amber-100 text-amber-700',    icon:'fa-credit-card',  step: 1 },
  PAID:             { label:'Đã thanh toán',   color:'bg-blue-100 text-blue-700',      icon:'fa-circle-check', step: 2 },
  PROCESSING:       { label:'Đang xử lý',      color:'bg-violet-100 text-violet-700',  icon:'fa-gear',         step: 3 },
  SHIPPED:          { label:'Đang giao',        color:'bg-orange-100 text-orange-700',  icon:'fa-truck',        step: 4 },
  DELIVERED:        { label:'Đã giao',          color:'bg-emerald-100 text-emerald-700',icon:'fa-box-open',     step: 5 },
  CANCELLED:        { label:'Đã huỷ',           color:'bg-rose-100 text-rose-600',      icon:'fa-ban',          step:-1 },
  REFUNDED:         { label:'Đã hoàn tiền',     color:'bg-gray-100 text-gray-500',      icon:'fa-rotate-left',  step:-1 },
}

// Các bước trong timeline (chỉ hiện khi không phải CANCELLED/REFUNDED)
const TIMELINE_STEPS = [
  { status: 'PENDING',          label: 'Đặt hàng',      icon: 'fa-cart-shopping' },
  { status: 'AWAITING_PAYMENT', label: 'Chờ thanh toán',icon: 'fa-credit-card'   },
  { status: 'PAID',             label: 'Đã thanh toán', icon: 'fa-circle-check'  },
  { status: 'PROCESSING',       label: 'Đang xử lý',    icon: 'fa-gear'          },
  { status: 'SHIPPED',          label: 'Đang giao',      icon: 'fa-truck'         },
  { status: 'DELIVERED',        label: 'Hoàn thành',     icon: 'fa-box-open'      },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt  = (p) => new Intl.NumberFormat('vi-VN').format(p) + 'đ'
const fmtDate = (d) => new Date(d).toLocaleString('vi-VN', {
  day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'
})

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full whitespace-nowrap
      ${size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-sm px-3 py-1.5'} ${cfg.color}`}>
      <i className={`fa-solid ${cfg.icon} text-xs`}></i>
      {cfg.label}
    </span>
  )
}

// ── Order Detail Modal ────────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose, onUpdateStatus }) {
  const [updating, setUpdating] = useState(false)
  const [confirmStatus, setConfirmStatus] = useState(null) // status đang chờ confirm

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
  const currentStep = cfg.step
  const isCancelledOrRefunded = currentStep < 0

  const handleConfirmUpdate = async () => {
    if (!confirmStatus) return
    setUpdating(true)
    try {
      await onUpdateStatus(order.id, confirmStatus)
      setConfirmStatus(null)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center
      justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh]
        flex flex-col shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Đơn hàng</p>
            <h2 className="text-lg font-bold text-gray-800 font-mono">{order.orderCode}</h2>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} size="md" />
            <button onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Timeline */}
          {!isCancelledOrRefunded ? (
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center">
                {TIMELINE_STEPS.map((step, i) => {
                  const done    = i <= currentStep
                  const current = i === currentStep
                  return (
                    <div key={i} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center
                          transition-all text-xs
                          ${done
                            ? current
                              ? 'bg-indigo-500 text-white ring-4 ring-indigo-100'
                              : 'bg-indigo-500 text-white'
                            : 'bg-gray-100 text-gray-300'
                          }`}>
                          <i className={`fa-solid ${step.icon}`}></i>
                        </div>
                        <p className={`text-[10px] mt-1.5 font-medium text-center leading-tight
                          ${done ? 'text-indigo-600' : 'text-gray-300'}`}>
                          {step.label}
                        </p>
                      </div>
                      {i < TIMELINE_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 mb-4 transition-all
                          ${i < currentStep ? 'bg-indigo-400' : 'bg-gray-150'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className={`mx-6 mt-5 px-4 py-3 rounded-xl flex items-center gap-2 text-sm
              ${order.status === 'CANCELLED' ? 'bg-rose-50 text-rose-600' : 'bg-gray-100 text-gray-600'}`}>
              <i className={`fa-solid ${cfg.icon}`}></i>
              <span className="font-medium">Đơn hàng {cfg.label.toLowerCase()}</span>
              <span className="text-xs opacity-70">— {fmtDate(order.createdAt)}</span>
            </div>
          )}

          <div className="px-6 py-5 space-y-5">

            {/* Info row */}
            <div className="grid grid-cols-2 gap-4">

              {/* Khách hàng + địa chỉ */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  <i className="fa-solid fa-location-dot mr-1.5 text-indigo-400"></i>
                  Giao hàng
                </p>
                <div className="space-y-1.5 text-sm">
                  <p className="font-semibold text-gray-800">{order.shippingName}</p>
                  <p className="text-gray-500 flex items-center gap-1.5">
                    <i className="fa-solid fa-phone text-xs text-gray-300"></i>
                    {order.shippingPhone}
                  </p>
                  <p className="text-gray-500 flex items-start gap-1.5">
                    <i className="fa-solid fa-map-pin text-xs text-gray-300 mt-0.5"></i>
                    {order.shippingAddress}
                  </p>
                  {order.note && (
                    <p className="text-gray-400 italic text-xs flex items-start gap-1.5 pt-1 border-t border-gray-200">
                      <i className="fa-solid fa-note-sticky text-xs mt-0.5"></i>
                      {order.note}
                    </p>
                  )}
                </div>
              </div>

              {/* Thanh toán + tiền */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  <i className="fa-solid fa-receipt mr-1.5 text-indigo-400"></i>
                  Thanh toán
                </p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phương thức</span>
                    <span className="font-medium text-gray-700">
                      {order.payment?.gateway || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Trạng thái TT</span>
                    <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${
                      order.payment?.status === 'SUCCESS'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {order.payment?.status === 'SUCCESS' ? '✓ Đã TT' : order.payment?.status || '—'}
                    </span>
                  </div>
                  {order.payment?.paidAt && (
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Thời gian TT</span>
                      <span>{fmtDate(order.payment.paidAt)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Tạm tính</span><span>{fmt(order.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Phí ship</span>
                      <span className={order.shippingFee == 0 ? 'text-emerald-500' : ''}>
                        {order.shippingFee == 0 ? 'Miễn phí' : fmt(order.shippingFee)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-800">
                      <span>Tổng cộng</span>
                      <span className="text-indigo-600">{fmt(order.finalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sản phẩm */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                <i className="fa-solid fa-box mr-1.5 text-indigo-400"></i>
                Sản phẩm ({order.orderItems?.length || 0})
              </p>
              <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
                {order.orderItems?.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                      {item.productImg
                        ? <img src={item.productImg} className="w-full h-full object-cover"
                            crossOrigin="anonymous" referrerPolicy="no-referrer" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <i className="fa-solid fa-image text-gray-300"></i>
                          </div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">
                        {item.productName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {fmt(item.unitPrice)} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-700 flex-shrink-0">
                      {fmt(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cập nhật trạng thái */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                <i className="fa-solid fa-arrows-rotate mr-1.5 text-indigo-400"></i>
                Chuyển trạng thái
              </p>

              {/* Confirm box */}
              {confirmStatus && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl
                  flex items-center justify-between gap-3">
                  <p className="text-sm text-amber-700">
                    <i className="fa-solid fa-triangle-exclamation mr-1.5"></i>
                    Xác nhận chuyển sang
                    <span className="font-bold ml-1">
                      {STATUS_CONFIG[confirmStatus]?.label}
                    </span>?
                  </p>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setConfirmStatus(null)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-200
                        text-gray-600 hover:bg-gray-50 transition-colors">
                      Huỷ
                    </button>
                    <button onClick={handleConfirmUpdate} disabled={updating}
                      className="px-3 py-1.5 text-xs rounded-lg bg-indigo-500 text-white
                        hover:bg-indigo-600 disabled:opacity-60 transition-colors font-medium">
                      {updating
                        ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i>Đang lưu</>
                        : 'Xác nhận'}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                  const isCurrent = key === order.status
                  return (
                    <button key={key}
                      disabled={isCurrent || updating}
                      onClick={() => setConfirmStatus(key)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                        text-sm font-medium transition-all text-left
                        ${isCurrent
                          ? 'border-2 border-indigo-300 bg-indigo-50 text-indigo-700 cursor-default'
                          : confirmStatus === key
                            ? 'border-2 border-amber-300 bg-amber-50 text-amber-700'
                            : 'border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 text-gray-600'
                        }`}>
                      <i className={`fa-solid ${cfg.icon} w-4 text-sm flex-shrink-0`}></i>
                      <span className="flex-1 leading-tight">{cfg.label}</span>
                      {isCurrent && (
                        <i className="fa-solid fa-check text-indigo-500 text-xs flex-shrink-0"></i>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            <i className="fa-solid fa-clock mr-1"></i>
            Đặt lúc {fmtDate(order.createdAt)}
          </p>
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200
              text-gray-600 rounded-xl transition-colors">
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OrdersAdminPage() {
  const queryClient = useQueryClient()
  const [page, setPage]               = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [keyword, setKeyword]         = useState('')
  const [selected, setSelected]       = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, filterStatus],
    queryFn: () => orderAPI.getAllOrders({
      page, size: 15,
      status: filterStatus || undefined,
    }).then(r => r.data),
    refetchInterval: 30000,
  })

  const handleUpdateStatus = async (id, status) => {
    try {
      const updated = await orderAPI.updateStatus(id, status).then(r => r.data)
      toast.success('Cập nhật trạng thái thành công!')
      queryClient.invalidateQueries(['admin-orders'])
      queryClient.invalidateQueries(['dashboard'])
      // Cập nhật selected để modal hiển thị trạng thái mới
      setSelected(updated)
    } catch {
      toast.error('Không thể cập nhật trạng thái')
    }
  }

  // Lọc client-side theo keyword (mã đơn / tên KH / SĐT)
  const rows = data?.content?.filter(o => {
    if (!keyword.trim()) return true
    const q = keyword.toLowerCase()
    return (
      o.orderCode?.toLowerCase().includes(q) ||
      o.userName?.toLowerCase().includes(q) ||
      o.shippingPhone?.includes(q)
    )
  }) ?? []

  return (
    <div className="p-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-bag-shopping text-indigo-500"></i>
            Quản lý đơn hàng
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {data?.totalElements || 0} đơn hàng
          </p>
        </div>

        {/* Filter + Search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              className="input pl-9 w-60 text-sm"
              placeholder="Mã đơn, tên KH, SĐT..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
          </div>
          <select className="input w-48 text-sm" value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(0) }}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Status tabs (quick filter) ── */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[{ key: '', label: 'Tất cả', count: data?.totalElements }].concat(
          Object.entries(STATUS_CONFIG).map(([k, v]) => ({ key: k, label: v.label }))
        ).map(item => (
          <button key={item.key}
            onClick={() => { setFilterStatus(item.key); setPage(0) }}
            className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full
              transition-colors border ${
              filterStatus === item.key
                ? 'bg-indigo-500 text-white border-indigo-500'
                : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}>
            {item.label}
            {item.key === '' && item.count != null && (
              <span className="ml-1 opacity-70">({item.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Mã đơn', 'Khách hàng', 'Thời gian', 'Sản phẩm', 'Tổng tiền', 'Thanh toán', 'Trạng thái', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 px-4 py-3
                    uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? [...Array(8)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded w-full"></div>
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-300">
                        <i className="fa-solid fa-inbox text-3xl mb-2 block"></i>
                        <p className="text-sm">Không có đơn hàng nào</p>
                      </td>
                    </tr>
                  )
                  : rows.map(order => {
                    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
                    const itemCount = order.orderItems?.length ?? 0
                    return (
                      <tr key={order.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setSelected(order)}>

                        <td className="px-4 py-3">
                          <p className="text-sm font-mono font-bold text-gray-700">
                            {order.orderCode}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-800">{order.userName}</p>
                          <p className="text-xs text-gray-400">{order.shippingPhone}</p>
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {fmtDate(order.createdAt)}
                        </td>

                        <td className="px-4 py-3">
                          {itemCount > 0 ? (
                            <div className="flex items-center gap-2">
                              {/* Ảnh sản phẩm đầu tiên */}
                              {order.orderItems[0]?.productImg && (
                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                  <img src={order.orderItems[0].productImg}
                                    className="w-full h-full object-cover"
                                    crossOrigin="anonymous" referrerPolicy="no-referrer" />
                                </div>
                              )}
                              <div>
                                <p className="text-xs text-gray-700 font-medium line-clamp-1 max-w-[120px]">
                                  {order.orderItems[0]?.productName}
                                </p>
                                {itemCount > 1 && (
                                  <p className="text-[10px] text-gray-400">
                                    +{itemCount - 1} sản phẩm khác
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-indigo-600">
                            {fmt(order.finalAmount)}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">
                            {order.payment?.gateway || '—'}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge status={order.status} />
                        </td>

                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setSelected(order)}
                            className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-lg
                              transition-colors" title="Xem chi tiết">
                            <i className="fa-solid fa-arrow-up-right-from-square text-sm"></i>
                          </button>
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
            <p className="text-xs text-gray-400">
              Trang {page + 1} / {data.totalPages}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center
                  justify-center disabled:opacity-30 hover:bg-gray-50 transition-colors">
                <i className="fa-solid fa-chevron-left text-xs text-gray-500"></i>
              </button>
              {[...Array(Math.min(data.totalPages, 7))].map((_, i) => {
                // Sliding window pagination
                let pageNum = i
                if (data.totalPages > 7) {
                  const start = Math.max(0, Math.min(page - 3, data.totalPages - 7))
                  pageNum = start + i
                }
                return (
                  <button key={pageNum} onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {pageNum + 1}
                  </button>
                )
              })}
              <button onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))}
                disabled={page === data.totalPages - 1}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center
                  justify-center disabled:opacity-30 hover:bg-gray-50 transition-colors">
                <i className="fa-solid fa-chevron-right text-xs text-gray-500"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  )
}