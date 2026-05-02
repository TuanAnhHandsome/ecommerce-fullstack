import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { returnAPI } from '../../services/api'
import toast from 'react-hot-toast'

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING:   { label: 'Chờ duyệt',    color: 'bg-amber-100 text-amber-700',   icon: 'fa-clock',         dot: 'bg-amber-400' },
  APPROVED:  { label: 'Đã duyệt',     color: 'bg-blue-100 text-blue-700',     icon: 'fa-thumbs-up',     dot: 'bg-blue-400'  },
  REJECTED:  { label: 'Từ chối',      color: 'bg-rose-100 text-rose-600',     icon: 'fa-thumbs-down',   dot: 'bg-rose-400'  },
  COMPLETED: { label: 'Hoàn thành',   color: 'bg-emerald-100 text-emerald-700', icon: 'fa-circle-check', dot: 'bg-emerald-400' },
  REFUNDED:  { label: 'Đã hoàn tiền', color: 'bg-violet-100 text-violet-700', icon: 'fa-rotate-left',   dot: 'bg-violet-400' },
}

const REASON_LABELS = {
  DAMAGED:          'Hàng bị hỏng/lỗi',
  WRONG_ITEM:       'Giao sai hàng',
  NOT_AS_DESCRIBED: 'Không đúng mô tả',
  CHANGED_MIND:     'Đổi ý',
  OTHER:            'Lý do khác',
}

const TABS = [
  { key: 'ALL',       label: 'Tất cả' },
  { key: 'PENDING',   label: 'Chờ duyệt' },
  { key: 'APPROVED',  label: 'Đã duyệt' },
  { key: 'REJECTED',  label: 'Từ chối' },
  { key: 'COMPLETED', label: 'Hoàn thành' },
  { key: 'REFUNDED',  label: 'Đã hoàn tiền' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (p) => new Intl.NumberFormat('vi-VN').format(p) + 'đ'
const fmtDate = (d) => new Date(d).toLocaleString('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
})

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full whitespace-nowrap
      ${size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-sm px-3 py-1.5'} ${cfg.color}`}>
      <i className={`fa-solid ${cfg.icon} text-xs`}></i>
      {cfg.label}
    </span>
  )
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function ReturnDetailModal({ req, onClose, onUpdate }) {
  const [updating, setUpdating] = useState(false)
  const [adminNote, setAdminNote] = useState(req.adminNote || '')
  const [refundAmount, setRefundAmount] = useState(req.refundAmount || req.totalRefundAmount || '')
  const [action, setAction] = useState(null) // 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'REFUNDED'

  const handleSubmit = async () => {
    if (!action) return
    setUpdating(true)
    try {
      await onUpdate(req.id, {
        status: action,
        adminNote: adminNote || undefined,
        refundAmount: (action === 'REFUNDED' || action === 'COMPLETED') ? Number(refundAmount) : undefined,
      })
      onClose()
    } finally {
      setUpdating(false)
    }
  }

  const canApprove  = req.status === 'PENDING'
  const canReject   = req.status === 'PENDING'
  const canComplete = req.status === 'APPROVED'
  const canRefund   = req.status === 'APPROVED' || req.status === 'COMPLETED'

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Yêu cầu hoàn hàng</p>
            <h2 className="text-lg font-bold text-gray-800">#{req.id}</h2>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={req.status} size="md" />
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Khách hàng + đơn hàng */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                <i className="fa-solid fa-user mr-1.5 text-indigo-400"></i>Khách hàng
              </p>
              <p className="text-sm font-bold text-gray-800">{req.userName || '—'}</p>
              <p className="text-xs text-gray-400 mt-0.5">{req.userEmail || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                <i className="fa-solid fa-receipt mr-1.5 text-indigo-400"></i>Đơn hàng gốc
              </p>
              <p className="text-sm font-bold font-mono text-indigo-600">{req.orderCode || `#${req.orderId}`}</p>
              <p className="text-xs text-gray-400 mt-0.5">{fmtDate(req.createdAt)}</p>
            </div>
          </div>

          {/* Lý do hoàn */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
              <i className="fa-solid fa-triangle-exclamation mr-1.5"></i>Lý do yêu cầu
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {REASON_LABELS[req.reason] || req.reason}
            </p>
            {req.description && (
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{req.description}</p>
            )}
          </div>

          {/* Sản phẩm hoàn */}
          {req.items?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                <i className="fa-solid fa-box-open mr-1.5 text-indigo-400"></i>Sản phẩm hoàn ({req.items.length})
              </p>
              <div className="space-y-2">
                {req.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    {item.productImg && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        <img src={item.productImg} className="w-full h-full object-cover"
                          crossOrigin="anonymous" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-xs text-gray-400">{item.variantName}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400">x{item.quantity}</p>
                      <p className="text-sm font-bold text-indigo-600">{fmt(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tổng tiền hoàn */}
          {req.totalRefundAmount != null && (
            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
              <span className="text-sm font-semibold text-indigo-700">
                <i className="fa-solid fa-coins mr-2"></i>Tổng tiền cần hoàn
              </span>
              <span className="text-lg font-black text-indigo-700">{fmt(req.totalRefundAmount)}</span>
            </div>
          )}

          {/* Ghi chú cũ của admin nếu có */}
          {req.adminNote && req.status !== 'PENDING' && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                <i className="fa-solid fa-note-sticky mr-1.5 text-gray-300"></i>Ghi chú admin
              </p>
              <p className="text-sm text-gray-600">{req.adminNote}</p>
            </div>
          )}

          {/* Actions */}
          {(canApprove || canReject || canComplete || canRefund) && (
            <div className="border border-gray-100 rounded-xl p-4 space-y-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <i className="fa-solid fa-sliders mr-1.5 text-indigo-400"></i>Xử lý yêu cầu
              </p>

              {/* Ghi chú */}
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1.5 block">Ghi chú (tuỳ chọn)</label>
                <textarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  rows={2}
                  placeholder="Nhập ghi chú xử lý..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none
                    focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 resize-none transition"
                />
              </div>

              {/* Số tiền hoàn — chỉ khi duyệt / hoàn tiền */}
              {(action === 'REFUNDED' || action === 'COMPLETED') && (
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1.5 block">Số tiền hoàn thực tế</label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={e => setRefundAmount(e.target.value)}
                    placeholder={req.totalRefundAmount || 0}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none
                      focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
                  />
                </div>
              )}

              {/* Nút hành động */}
              <div className="flex flex-wrap gap-2">
                {canApprove && (
                  <button
                    onClick={() => setAction(a => a === 'APPROVED' ? null : 'APPROVED')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                      transition-all ${action === 'APPROVED'
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                    <i className="fa-solid fa-thumbs-up"></i>Duyệt yêu cầu
                  </button>
                )}
                {canReject && (
                  <button
                    onClick={() => setAction(a => a === 'REJECTED' ? null : 'REJECTED')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                      transition-all ${action === 'REJECTED'
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                        : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}>
                    <i className="fa-solid fa-thumbs-down"></i>Từ chối
                  </button>
                )}
                {canComplete && (
                  <button
                    onClick={() => setAction(a => a === 'COMPLETED' ? null : 'COMPLETED')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                      transition-all ${action === 'COMPLETED'
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                    <i className="fa-solid fa-box-open"></i>Đã nhận hàng
                  </button>
                )}
                {canRefund && (
                  <button
                    onClick={() => setAction(a => a === 'REFUNDED' ? null : 'REFUNDED')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                      transition-all ${action === 'REFUNDED'
                        ? 'bg-violet-500 text-white shadow-md shadow-violet-200'
                        : 'bg-violet-50 text-violet-600 hover:bg-violet-100'}`}>
                    <i className="fa-solid fa-rotate-left"></i>Đã hoàn tiền
                  </button>
                )}
              </div>

              {/* Confirm button */}
              {action && (
                <button
                  onClick={handleSubmit}
                  disabled={updating}
                  className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60
                    text-white text-sm font-bold rounded-xl transition-colors flex items-center
                    justify-center gap-2">
                  {updating
                    ? <><i className="fa-solid fa-spinner fa-spin"></i>Đang xử lý...</>
                    : <><i className="fa-solid fa-check"></i>Xác nhận cập nhật</>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReturnsAdminPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selected, setSelected] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-returns', page, statusFilter],
    queryFn: () => returnAPI.adminList({
      page, size: 15,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
    }).then(r => r.data),
  })

  const handleUpdate = async (id, payload) => {
    try {
      await returnAPI.adminUpdate(id, payload)
      toast.success('Cập nhật yêu cầu thành công!')
      queryClient.invalidateQueries(['admin-returns'])
      // refresh badge
      queryClient.invalidateQueries(['dashboard'])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật')
      throw err
    }
  }

  const rows = data?.content || []

  // Stats tính từ dữ liệu hiện có (hoặc có thể gọi API riêng)
  const pendingCount = data?.totalElements != null && statusFilter === 'PENDING' ? data.totalElements : null

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-rotate-left text-orange-500"></i>Hoàn hàng / Hoàn tiền
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{data?.totalElements || 0} yêu cầu</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map(tab => {
          const cfg = tab.key !== 'ALL' ? STATUS_CONFIG[tab.key] : null
          return (
            <button
              key={tab.key}
              onClick={() => { setStatusFilter(tab.key); setPage(0) }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                transition-all border ${statusFilter === tab.key
                  ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm'
                  : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200 hover:text-gray-700'
                }`}>
              {cfg && <span className={`w-2 h-2 rounded-full ${cfg.dot}`}></span>}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['#', 'Khách hàng', 'Đơn hàng', 'Lý do', 'Tiền hoàn', 'Ngày tạo', 'Trạng thái', ''].map(h => (
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
                      <td colSpan={8} className="text-center py-16 text-gray-300">
                        <i className="fa-solid fa-inbox text-3xl mb-2 block"></i>
                        <p className="text-sm">Không có yêu cầu nào</p>
                      </td>
                    </tr>
                  )
                  : rows.map(req => (
                    <tr key={req.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelected(req)}>

                      <td className="px-4 py-3">
                        <span className="text-xs font-mono font-semibold text-gray-500">#{req.id}</span>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-800">{req.userName}</p>
                        <p className="text-xs text-gray-400">{req.userEmail}</p>
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-sm font-mono font-bold text-indigo-600">
                          {req.orderCode || `#${req.orderId}`}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-medium">
                          {REASON_LABELS[req.reason] || req.reason}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-indigo-600">
                          {req.totalRefundAmount != null ? fmt(req.totalRefundAmount) : '—'}
                        </p>
                        {req.refundAmount != null && req.refundAmount !== req.totalRefundAmount && (
                          <p className="text-xs text-emerald-600 font-semibold">
                            Thực tế: {fmt(req.refundAmount)}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {fmtDate(req.createdAt)}
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={req.status} />
                      </td>

                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelected(req)}
                          className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-lg transition-colors">
                          <i className="fa-solid fa-arrow-up-right-from-square text-sm"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
            <p className="text-xs text-gray-400">Trang {page + 1} / {data.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center
                  justify-center disabled:opacity-30 hover:bg-gray-50 transition-colors">
                <i className="fa-solid fa-chevron-left text-xs text-gray-500"></i>
              </button>
              {[...Array(Math.min(data.totalPages, 7))].map((_, i) => {
                let pageNum = i
                if (data.totalPages > 7) {
                  const start = Math.max(0, Math.min(page - 3, data.totalPages - 7))
                  pageNum = start + i
                }
                return (
                  <button key={pageNum} onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === pageNum
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

      {/* Detail Modal */}
      {selected && (
        <ReturnDetailModal
          req={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
