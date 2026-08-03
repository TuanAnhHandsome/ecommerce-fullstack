import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { warrantyAPI } from '../../services/api'
import toast from 'react-hot-toast'

// ── Constants ──────────────────────────────────────────────────────────────────
const WARRANTY_STATUS_CONFIG = {
  PENDING:    { label: 'Chờ xử lý',    color: 'bg-amber-100 text-amber-700',    icon: 'fa-clock',         dot: 'bg-amber-400'    },
  PROCESSING: { label: 'Đang xử lý',   color: 'bg-blue-100 text-blue-700',      icon: 'fa-gear fa-spin',  dot: 'bg-blue-400'     },
  RESOLVED:   { label: 'Đã xử lý',     color: 'bg-emerald-100 text-emerald-700',icon: 'fa-circle-check',  dot: 'bg-emerald-400'  },
  REJECTED:   { label: 'Từ chối',      color: 'bg-rose-100 text-rose-600',      icon: 'fa-thumbs-down',   dot: 'bg-rose-400'     },
}

const WARRANTY_TYPES = [
  { value: 'WARRANTY', label: 'Bảo hành sản phẩm',       icon: 'fa-shield-halved'   },
  { value: 'REPAIR',   label: 'Sửa chữa',                 icon: 'fa-screwdriver-wrench' },
  { value: 'EXCHANGE', label: 'Đổi hàng',                 icon: 'fa-arrows-rotate'   },
]

const fmt     = (p) => new Intl.NumberFormat('vi-VN').format(p) + 'đ'
const fmtDate = (d) => new Date(d).toLocaleString('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

// ── Status Badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = WARRANTY_STATUS_CONFIG[status] || WARRANTY_STATUS_CONFIG.PENDING
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold
      rounded-full px-2.5 py-1 ${cfg.color}`}>
      <i className={`fa-solid ${cfg.icon} text-xs`}></i>
      {cfg.label}
    </span>
  )
}

// ── Request Card ───────────────────────────────────────────────────────────────
function WarrantyRequestCard({ req }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = WARRANTY_STATUS_CONFIG[req.status] || WARRANTY_STATUS_CONFIG.PENDING

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3
          hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`}></div>
          <div>
            <p className="text-xs font-mono font-bold text-indigo-600">
              #{req.requestCode || req.id}
            </p>
            <p className="text-xs text-gray-400">{fmtDate(req.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={req.status} />
          <i className={`fa-solid fa-chevron-down text-xs text-gray-300
            transition-transform ${expanded ? 'rotate-180' : ''}`}></i>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-3 bg-gray-50/60">
          {/* Loại bảo hành */}
          <div className="flex gap-2">
            <span className="text-xs text-gray-400 w-28 flex-shrink-0">Loại yêu cầu</span>
            <span className="text-xs font-semibold text-gray-700">
              {WARRANTY_TYPES.find(t => t.value === req.warrantyType)?.label || req.warrantyType}
            </span>
          </div>

          {/* Mô tả */}
          {req.description && (
            <div className="flex gap-2">
              <span className="text-xs text-gray-400 w-28 flex-shrink-0">Mô tả sự cố</span>
              <span className="text-xs text-gray-600 leading-relaxed">{req.description}</span>
            </div>
          )}

          {/* Sản phẩm */}
          {req.items?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Sản phẩm bảo hành</p>
              {req.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 bg-white rounded-lg p-2.5 mb-1.5">
                  {item.productImg && (
                    <img src={item.productImg} crossOrigin="anonymous"
                      className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{item.productName}</p>
                    {item.variantName && (
                      <p className="text-xs text-gray-400">{item.variantName}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Admin note nếu có */}
          {req.adminNote && (
            <div className={`rounded-lg px-3 py-2.5 text-xs
              ${req.status === 'REJECTED'
                ? 'bg-rose-50 border border-rose-100 text-rose-700'
                : 'bg-blue-50 border border-blue-100 text-blue-700'}`}
            >
              <p className="font-semibold mb-0.5 flex items-center gap-1.5">
                <i className="fa-solid fa-circle-info"></i>Phản hồi từ shop
              </p>
              <p className="leading-relaxed">{req.adminNote}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Submission Form ────────────────────────────────────────────────────────────
function WarrantyForm({ order, onSuccess }) {
  const [warrantyType, setWarrantyType]   = useState('')
  const [description, setDescription]     = useState('')
  const [selectedItems, setSelectedItems] = useState([])

const mutation = useMutation({
  mutationFn: () => warrantyAPI.create({
    orderId: order.id,
    type: warrantyType,               
    description,
    productName: order.orderItems?.[0]?.productName || 'Sản phẩm', 
  }),
    onSuccess: () => {
      toast.success('Gửi yêu cầu bảo hành thành công!')
      onSuccess()
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Không thể gửi yêu cầu')
    },
  })

  const toggleItem = (id) =>
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )

  const canSubmit =
    warrantyType &&
    description.trim().length >= 10 &&
    selectedItems.length > 0 &&
    !mutation.isPending

  return (
    <div className="space-y-5">
      {/* Chọn sản phẩm */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2.5">
          Sản phẩm cần bảo hành <span className="text-red-500">*</span>
        </p>
        <div className="space-y-2">
          {order.orderItems?.map((item) => {
            const checked = selectedItems.includes(item.orderItemId ?? item.id)
            return (
              <label
                key={item.orderItemId ?? item.id}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer
                  transition-all ${checked
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-100 hover:border-gray-200 bg-white'}`}
              >
                <input
                  type="checkbox"
                  className="accent-blue-500 w-4 h-4 flex-shrink-0"
                  checked={checked}
                  onChange={() => toggleItem(item.orderItemId ?? item.id)}
                />
                {item.productImg && (
                  <img src={item.productImg} crossOrigin="anonymous"
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {item.productName}
                  </p>
                  {item.variantName && (
                    <p className="text-xs text-gray-400">{item.variantName}</p>
                  )}
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* Loại bảo hành */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2.5">
          Loại sự cố <span className="text-red-500">*</span>
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {WARRANTY_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setWarrantyType(t.value)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs
                font-medium transition-all ${warrantyType === t.value
                  ? 'border-blue-400 bg-blue-50 text-blue-700'
                  : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:text-gray-700'}`}
            >
              <i className={`fa-solid ${t.icon} text-base`}></i>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mô tả */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1.5">
          Mô tả sự cố <span className="text-red-500">*</span>
          <span className="text-gray-400 font-normal ml-1">(tối thiểu 10 ký tự)</span>
        </p>
        <textarea
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Mô tả chi tiết sự cố bạn gặp phải..."
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none
            focus:ring-2 focus:ring-blue-200 focus:border-blue-300 resize-none transition"
          maxLength={500}
        />
        <p className="text-xs text-gray-300 text-right mt-0.5">{description.length}/500</p>
      </div>

      <button
        onClick={() => mutation.mutate()}
        disabled={!canSubmit}
        className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50
          disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl
          transition-colors flex items-center justify-center gap-2"
      >
        {mutation.isPending
          ? <><i className="fa-solid fa-spinner fa-spin"></i>Đang gửi...</>
          : <><i className="fa-solid fa-paper-plane"></i>Gửi yêu cầu bảo hành</>
        }
      </button>
    </div>
  )
}

// ── Main Modal ─────────────────────────────────────────────────────────────────
export default function WarrantyModal({ order, onClose }) {
  const [tab, setTab] = useState('list') // 'list' | 'new'

  // Fetch existing warranty requests for this order
  const { data: requests = [], isLoading, refetch } = useQuery({
  queryKey: ['warranty-requests', order.id],
  queryFn: () => warrantyAPI.getMyList({ size: 100 })
    .then(r => r.data.content.filter(req => req.orderId === order.id)),
})

  const handleFormSuccess = () => {
    refetch()
    setTab('list')
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center
      justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-lg max-h-[90vh]
        flex flex-col shadow-2xl rounded-t-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <i className="fa-solid fa-shield-halved text-blue-500"></i>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">Bảo hành / Sửa chữa</h2>
              <p className="text-xs text-gray-400">#{order.orderCode}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 px-5 pt-4 flex-shrink-0">
          <button
            onClick={() => setTab('list')}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all
              ${tab === 'list'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <i className="fa-solid fa-list-ul mr-1.5"></i>
            Yêu cầu của tôi
            {requests.length > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full
                ${tab === 'list' ? 'bg-white/20' : 'bg-gray-200 text-gray-600'}`}>
                {requests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('new')}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all
              ${tab === 'new'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <i className="fa-solid fa-plus mr-1.5"></i>Gửi yêu cầu mới
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* Tab: List */}
          {tab === 'list' && (
            isLoading
              ? (
                <div className="space-y-2 animate-pulse">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
                  ))}
                </div>
              )
              : requests.length === 0
                ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center
                      justify-center mx-auto mb-3">
                      <i className="fa-solid fa-shield-halved text-gray-300 text-2xl"></i>
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Chưa có yêu cầu bảo hành</p>
                    <p className="text-xs text-gray-300 mt-1">
                      Sản phẩm gặp sự cố? Gửi yêu cầu ngay
                    </p>
                    <button
                      onClick={() => setTab('new')}
                      className="mt-4 text-sm text-blue-500 font-semibold
                        hover:underline flex items-center gap-1.5 mx-auto"
                    >
                      <i className="fa-solid fa-plus text-xs"></i>Tạo yêu cầu mới
                    </button>
                  </div>
                )
                : (
                  <div className="space-y-2">
                    {requests.map(req => (
                      <WarrantyRequestCard key={req.id} req={req} />
                    ))}
                  </div>
                )
          )}

          {/* Tab: New form */}
          {tab === 'new' && (
            <WarrantyForm order={order} onSuccess={handleFormSuccess} />
          )}
        </div>
      </div>
    </div>
  )
}