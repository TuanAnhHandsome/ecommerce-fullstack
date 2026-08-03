import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { returnAPI } from '../../services/api'
import toast from 'react-hot-toast'

// ── Constants ──────────────────────────────────────────────────────────────────
const RETURN_STATUS_CONFIG = {
  PENDING:   { label: 'Chờ duyệt',    color: 'bg-amber-100 text-amber-700',    icon: 'fa-clock',         dot: 'bg-amber-400',   step: 0 },
  APPROVED:  { label: 'Đã duyệt',     color: 'bg-blue-100 text-blue-700',      icon: 'fa-thumbs-up',     dot: 'bg-blue-400',    step: 1 },
  COMPLETED: { label: 'Đã nhận hàng', color: 'bg-emerald-100 text-emerald-700',icon: 'fa-box-open',      dot: 'bg-emerald-400', step: 2 },
  REFUNDED:  { label: 'Đã hoàn tiền', color: 'bg-violet-100 text-violet-700',  icon: 'fa-rotate-left',   dot: 'bg-violet-400',  step: 3 },
  REJECTED:  { label: 'Từ chối',      color: 'bg-rose-100 text-rose-600',      icon: 'fa-thumbs-down',   dot: 'bg-rose-400',    step: -1 },
}

const RETURN_STEPS = [
  { label: 'Gửi yêu cầu', icon: 'fa-paper-plane'  },
  { label: 'Shop duyệt',   icon: 'fa-thumbs-up'    },
  { label: 'Gửi hàng về', icon: 'fa-box-open'     },
  { label: 'Hoàn tiền',   icon: 'fa-rotate-left'  },
]

const RETURN_REASONS = [
  { value: 'DEFECTIVE',        label: 'Hàng bị hỏng / lỗi',    icon: 'fa-triangle-exclamation' },
  { value: 'WRONG_ITEM',       label: 'Giao sai hàng',          icon: 'fa-arrows-rotate'        },
  { value: 'NOT_AS_DESCRIBED', label: 'Không đúng mô tả',       icon: 'fa-file-circle-xmark'    },
  { value: 'CHANGED_MIND',     label: 'Đổi ý không muốn nữa',  icon: 'fa-face-meh'             },
  { value: 'MISSING_PARTS',    label: 'Thiếu phụ kiện',         icon: 'fa-box-open'             },
  { value: 'OTHER',            label: 'Lý do khác',             icon: 'fa-circle-question'      },
]

const fmt     = (p) => new Intl.NumberFormat('vi-VN').format(p) + 'đ'
const fmtDate = (d) => new Date(d).toLocaleString('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

// ── Status Badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = RETURN_STATUS_CONFIG[status] || RETURN_STATUS_CONFIG.PENDING
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold
      rounded-full px-2.5 py-1 ${cfg.color}`}>
      <i className={`fa-solid ${cfg.icon} text-xs`}></i>
      {cfg.label}
    </span>
  )
}

// ── Progress Steps ─────────────────────────────────────────────────────────────
function ReturnProgress({ status }) {
  const cfg = RETURN_STATUS_CONFIG[status]
  if (!cfg || cfg.step < 0) return null
  const currentStep = cfg.step

  return (
    <div className="flex items-center justify-between py-2">
      {RETURN_STEPS.map((step, i) => (
        <div key={i} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
              ${i <= currentStep
                ? 'bg-red-500 text-white shadow-sm shadow-red-200'
                : 'bg-gray-100 text-gray-400'}`}
            >
              <i className={`fa-solid ${step.icon} text-xs`}></i>
            </div>
            <p className={`text-xs mt-1 font-medium whitespace-nowrap
              ${i <= currentStep ? 'text-red-500' : 'text-gray-300'}`}>
              {step.label}
            </p>
          </div>
          {i < RETURN_STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 mb-4 transition-all
              ${i < currentStep ? 'bg-red-400' : 'bg-gray-100'}`}
            ></div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Request Card ───────────────────────────────────────────────────────────────
function ReturnRequestCard({ req }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = RETURN_STATUS_CONFIG[req.status] || RETURN_STATUS_CONFIG.PENDING
  const isRejected = req.status === 'REJECTED'

  return (
    <div className={`border rounded-xl overflow-hidden transition-all
      ${isRejected ? 'border-rose-100' : 'border-gray-100'}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3
          hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`}></div>
          <div>
            <p className="text-xs font-mono font-bold text-red-500">
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

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4 bg-gray-50/60">

          {/* Progress bar — ẩn khi rejected */}
          {!isRejected && (
            <div className="bg-white rounded-xl p-3 border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-3">
                <i className="fa-solid fa-route mr-1.5 text-gray-300"></i>Tiến trình xử lý
              </p>
              <ReturnProgress status={req.status} />
            </div>
          )}

          {/* Rejected notice */}
          {isRejected && req.adminNote && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl px-3 py-3 text-xs">
              <p className="font-semibold text-rose-700 flex items-center gap-1.5 mb-1">
                <i className="fa-solid fa-circle-xmark"></i>Yêu cầu bị từ chối
              </p>
              <p className="text-rose-600 leading-relaxed">{req.adminNote}</p>
            </div>
          )}

          {/* Info rows */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <p className="text-gray-400 mb-0.5">Lý do hoàn</p>
              <p className="font-semibold text-gray-700">
                {RETURN_REASONS.find(r => r.value === req.reason)?.label || req.reason}
              </p>
            </div>
            {req.totalRefundAmount != null && (
              <div>
                <p className="text-gray-400 mb-0.5">Số tiền yêu cầu</p>
                <p className="font-bold text-indigo-600">{fmt(req.totalRefundAmount)}</p>
              </div>
            )}
            {req.refundAmount != null && req.status === 'REFUNDED' && (
              <div>
                <p className="text-gray-400 mb-0.5">Thực tế đã hoàn</p>
                <p className="font-bold text-emerald-600">{fmt(req.refundAmount)}</p>
              </div>
            )}
          </div>

          {/* Description */}
          {req.description && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Mô tả chi tiết</p>
              <p className="text-xs text-gray-600 leading-relaxed bg-white rounded-lg
                px-3 py-2 border border-gray-100">
                {req.description}
              </p>
            </div>
          )}

          {/* Items */}
          {req.items?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">
                Sản phẩm hoàn ({req.items.length})
              </p>
              <div className="space-y-1.5">
                {req.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 bg-white
                    rounded-lg p-2.5 border border-gray-100">
                    {item.productImg && (
                      <img src={item.productImg} crossOrigin="anonymous"
                        className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">
                        {item.productName}
                      </p>
                      {item.variantName && (
                        <p className="text-xs text-gray-400">{item.variantName}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 text-xs">
                      <p className="text-gray-400">x{item.quantity}</p>
                      <p className="font-bold text-gray-700">
                        {fmt(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin note (approved/completed) */}
          {req.adminNote && !isRejected && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-xs">
              <p className="font-semibold text-blue-700 flex items-center gap-1.5 mb-1">
                <i className="fa-solid fa-circle-info"></i>Ghi chú từ shop
              </p>
              <p className="text-blue-600 leading-relaxed">{req.adminNote}</p>
            </div>
          )}

          {/* Approved: shipping instructions */}
          {req.status === 'APPROVED' && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-3 text-xs">
              <p className="font-semibold text-amber-700 flex items-center gap-1.5 mb-2">
                <i className="fa-solid fa-truck"></i>Hướng dẫn gửi hàng về
              </p>
              <ul className="text-amber-700 space-y-1 leading-relaxed">
                <li>• Đóng gói kỹ sản phẩm trước khi gửi</li>
                <li>• Ghi mã yêu cầu <strong>#{req.requestCode || req.id}</strong> lên kiện hàng</li>
                <li>• Gửi hàng về địa chỉ shop trong 3 ngày</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Submission Form ────────────────────────────────────────────────────────────
function ReturnForm({ order, onSuccess }) {
  const [reason, setReason]               = useState('')
  const [description, setDescription]     = useState('')
  const [selectedItems, setSelectedItems] = useState([])

const mutation = useMutation({
  mutationFn: () => returnAPI.create({
    orderId: order.id,
    reason,
    description,
    items: selectedItems.map(id => ({  
      orderItemId: id,
      quantity: 1,                       
    })),
  }),
    onSuccess: () => {
      toast.success('Gửi yêu cầu hoàn hàng thành công!')
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
    reason &&
    description.trim().length >= 10 &&
    selectedItems.length > 0 &&
    !mutation.isPending

  return (
    <div className="space-y-5">
      {/* Policy notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs">
        <p className="font-semibold text-amber-700 flex items-center gap-1.5 mb-1.5">
          <i className="fa-solid fa-circle-info"></i>Chính sách đổi trả
        </p>
        <ul className="text-amber-600 space-y-1 leading-relaxed">
          <li>• Áp dụng trong <strong>7 ngày</strong> kể từ ngày nhận hàng</li>
          <li>• Sản phẩm còn nguyên hộp, chưa qua sử dụng</li>
          <li>• Hoàn tiền trong 3–5 ngày làm việc sau khi shop nhận hàng</li>
        </ul>
      </div>

      {/* Chọn sản phẩm */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2.5">
          Sản phẩm cần hoàn <span className="text-red-500">*</span>
        </p>
        <div className="space-y-2">
          {order.orderItems?.map((item) => {
            const itemId = item.orderItemId ?? item.id
            const checked = selectedItems.includes(itemId)
            const subtotal = item.unitPrice * item.quantity
            return (
              <label
                key={itemId}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer
                  transition-all ${checked
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-100 hover:border-gray-200 bg-white'}`}
              >
                <input
                  type="checkbox"
                  className="accent-red-500 w-4 h-4 flex-shrink-0"
                  checked={checked}
                  onChange={() => toggleItem(itemId)}
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
                <p className="text-sm font-bold text-gray-700 flex-shrink-0">
                  {fmt(subtotal)}
                </p>
              </label>
            )
          })}
        </div>
      </div>

      {/* Lý do */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2.5">
          Lý do hoàn hàng <span className="text-red-500">*</span>
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {RETURN_REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setReason(r.value)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs
                font-medium transition-all ${reason === r.value
                  ? 'border-red-400 bg-red-50 text-red-700'
                  : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}
            >
              <i className={`fa-solid ${r.icon} text-base`}></i>
              <span className="text-center leading-snug">{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mô tả */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1.5">
          Mô tả thêm <span className="text-red-500">*</span>
          <span className="text-gray-400 font-normal ml-1">(tối thiểu 10 ký tự)</span>
        </p>
        <textarea
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Mô tả chi tiết lý do bạn muốn hoàn hàng..."
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none
            focus:ring-2 focus:ring-red-200 focus:border-red-300 resize-none transition"
          maxLength={500}
        />
        <p className="text-xs text-gray-300 text-right mt-0.5">{description.length}/500</p>
      </div>

      <button
        onClick={() => mutation.mutate()}
        disabled={!canSubmit}
        className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50
          disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl
          transition-colors flex items-center justify-center gap-2"
      >
        {mutation.isPending
          ? <><i className="fa-solid fa-spinner fa-spin"></i>Đang gửi...</>
          : <><i className="fa-solid fa-paper-plane"></i>Gửi yêu cầu hoàn hàng</>
        }
      </button>
    </div>
  )
}

// ── Main Modal ─────────────────────────────────────────────────────────────────
export default function ReturnModal({ order, onClose }) {
  const [tab, setTab] = useState('list') // 'list' | 'new'

  const { data: requests = [], isLoading, refetch } = useQuery({
  queryKey: ['return-requests', order.id],
  queryFn: () => returnAPI.getMyList({ size: 100 })
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
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <i className="fa-solid fa-rotate-left text-red-500"></i>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">Hoàn hàng / Hoàn tiền</h2>
              <p className="text-xs text-gray-400">#{order.orderCode} · Đổi trả trong 7 ngày</p>
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
                ? 'bg-red-500 text-white shadow-sm'
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
                ? 'bg-red-500 text-white shadow-sm'
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
                      <i className="fa-solid fa-rotate-left text-gray-300 text-2xl"></i>
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Chưa có yêu cầu hoàn hàng</p>
                    <p className="text-xs text-gray-300 mt-1">
                      Chính sách đổi trả trong 7 ngày kể từ khi nhận hàng
                    </p>
                    <button
                      onClick={() => setTab('new')}
                      className="mt-4 text-sm text-red-500 font-semibold
                        hover:underline flex items-center gap-1.5 mx-auto"
                    >
                      <i className="fa-solid fa-plus text-xs"></i>Tạo yêu cầu mới
                    </button>
                  </div>
                )
                : (
                  <div className="space-y-2">
                    {requests.map(req => (
                      <ReturnRequestCard key={req.id} req={req} />
                    ))}
                  </div>
                )
          )}

          {/* Tab: New form */}
          {tab === 'new' && (
            <ReturnForm order={order} onSuccess={handleFormSuccess} />
          )}
        </div>
      </div>
    </div>
  )
}