import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { warrantyAPI } from '../../services/api'
import toast from 'react-hot-toast'

// ── Config ────────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  WARRANTY: { label: 'Bảo hành',  color: 'bg-blue-100 text-blue-700',     icon: 'fa-shield-halved' },
  REPAIR:   { label: 'Sửa chữa', color: 'bg-orange-100 text-orange-700',  icon: 'fa-screwdriver-wrench' },
  EXCHANGE: { label: 'Đổi hàng', color: 'bg-violet-100 text-violet-700',  icon: 'fa-arrow-right-arrow-left' },
  RETURN:   { label: 'Trả hàng', color: 'bg-rose-100 text-rose-600',      icon: 'fa-rotate-left' },
}

const STATUS_CONFIG = {
  PENDING:      { label: 'Chờ tiếp nhận', color: 'bg-gray-100 text-gray-600',      icon: 'fa-clock',           step: 0 },
  RECEIVED:     { label: 'Đã tiếp nhận',  color: 'bg-blue-100 text-blue-700',      icon: 'fa-inbox',           step: 1 },
  DIAGNOSING:   { label: 'Đang kiểm tra', color: 'bg-amber-100 text-amber-700',    icon: 'fa-magnifying-glass',step: 2 },
  REPAIRING:    { label: 'Đang sửa',      color: 'bg-orange-100 text-orange-700',  icon: 'fa-screwdriver-wrench', step: 3 },
  WAITING_PART: { label: 'Chờ linh kiện', color: 'bg-yellow-100 text-yellow-700',  icon: 'fa-box-open',        step: 4 },
  DONE:         { label: 'Hoàn thành',    color: 'bg-emerald-100 text-emerald-700',icon: 'fa-circle-check',    step: 5 },
  RETURNED:     { label: 'Đã trả khách',  color: 'bg-teal-100 text-teal-700',      icon: 'fa-handshake',       step: 6 },
  REJECTED:     { label: 'Từ chối',       color: 'bg-rose-100 text-rose-600',      icon: 'fa-ban',             step: -1 },
}

const TIMELINE_STEPS = [
  'PENDING', 'RECEIVED', 'DIAGNOSING', 'REPAIRING', 'WAITING_PART', 'DONE', 'RETURNED'
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleString('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit'
}) : '—'

const fmtDateInput = (d) => d ? new Date(d).toISOString().slice(0, 16) : ''

// ── Badges ───────────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.WARRANTY
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
      <i className={`fa-solid ${cfg.icon} text-[10px]`}></i>{cfg.label}
    </span>
  )
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${cfg.color}`}>
      <i className={`fa-solid ${cfg.icon} text-[10px]`}></i>{cfg.label}
    </span>
  )
}

// ── Detail + Update Modal ─────────────────────────────────────────────────────
function WarrantyDetailModal({ item, onClose, onUpdate }) {
  const [status, setStatus]   = useState(item.status)
  const [note, setNote]       = useState(item.adminNote || '')
  const [estDate, setEstDate] = useState(fmtDateInput(item.estimatedReturnDate))
  const [saving, setSaving]   = useState(false)

  const currentStep  = STATUS_CONFIG[item.status]?.step ?? 0
  const isTerminated = item.status === 'RETURNED' || item.status === 'REJECTED'

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate(item.id, {
        status,
        adminNote: note,
        estimatedReturnDate: estDate ? new Date(estDate).toISOString() : null,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center
      justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Yêu cầu bảo hành / hậu mãi</p>
            <h2 className="text-lg font-bold text-gray-800 font-mono">{item.requestCode}</h2>
          </div>
          <div className="flex items-center gap-3">
            <TypeBadge type={item.type} />
            <StatusBadge status={item.status} />
            <button onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Timeline */}
          {!isTerminated && (
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center">
                {TIMELINE_STEPS.map((s, i) => {
                  const done    = STATUS_CONFIG[item.status]?.step >= STATUS_CONFIG[s]?.step
                  const current = item.status === s
                  return (
                    <div key={s} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] transition-all
                          ${done
                            ? current
                              ? 'bg-indigo-500 text-white ring-4 ring-indigo-100'
                              : 'bg-indigo-400 text-white'
                            : 'bg-gray-100 text-gray-300'}`}>
                          <i className={`fa-solid ${STATUS_CONFIG[s]?.icon}`}></i>
                        </div>
                        <p className={`text-[9px] mt-1 font-medium text-center leading-tight max-w-[52px]
                          ${done ? 'text-indigo-600' : 'text-gray-300'}`}>
                          {STATUS_CONFIG[s]?.label}
                        </p>
                      </div>
                      {i < TIMELINE_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < currentStep ? 'bg-indigo-400' : 'bg-gray-100'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="px-6 py-5 space-y-5">

            {/* Thông tin khách hàng + sản phẩm */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  <i className="fa-solid fa-user mr-1.5 text-indigo-400"></i>Khách hàng
                </p>
                <div className="space-y-1.5 text-sm">
                  <p className="font-semibold text-gray-800">{item.userName}</p>
                  <p className="text-gray-500 flex items-center gap-1.5">
                    <i className="fa-solid fa-envelope text-xs text-gray-300"></i>
                    {item.userEmail}
                  </p>
                  {item.userPhone && (
                    <p className="text-gray-500 flex items-center gap-1.5">
                      <i className="fa-solid fa-phone text-xs text-gray-300"></i>
                      {item.userPhone}
                    </p>
                  )}
                  {item.orderCode && (
                    <p className="text-gray-500 flex items-center gap-1.5 pt-1 border-t border-gray-200 mt-1">
                      <i className="fa-solid fa-receipt text-xs text-gray-300"></i>
                      Đơn: <span className="font-mono font-medium text-indigo-600">{item.orderCode}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  <i className="fa-solid fa-microchip mr-1.5 text-indigo-400"></i>Sản phẩm
                </p>
                <div className="space-y-1.5 text-sm">
                  <p className="font-semibold text-gray-800">{item.productName}</p>
                  {item.serialNumber && (
                    <p className="text-gray-500 flex items-center gap-1.5">
                      <i className="fa-solid fa-barcode text-xs text-gray-300"></i>
                      S/N: <span className="font-mono">{item.serialNumber}</span>
                    </p>
                  )}
                  <p className="text-gray-400 text-xs pt-1 border-t border-gray-200 mt-1">
                    Tiếp nhận: {fmtDate(item.createdAt)}
                  </p>
                  {item.resolvedAt && (
                    <p className="text-gray-400 text-xs">
                      Hoàn thành: {fmtDate(item.resolvedAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Mô tả lỗi từ khách */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">
                <i className="fa-solid fa-circle-exclamation mr-1.5"></i>Mô tả lỗi
              </p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {item.description}
              </p>
            </div>

            {/* Admin controls */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <i className="fa-solid fa-sliders mr-1.5 text-indigo-400"></i>Xử lý
              </p>

              {/* Cập nhật trạng thái */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Trạng thái</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button key={key} type="button"
                      onClick={() => setStatus(key)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm
                        font-medium transition-all text-left border
                        ${status === key
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                          : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50 text-gray-600'
                        }`}>
                      <i className={`fa-solid ${cfg.icon} w-4 text-xs flex-shrink-0`}></i>
                      <span className="flex-1 leading-tight">{cfg.label}</span>
                      {status === key && (
                        <i className="fa-solid fa-check text-indigo-500 text-xs flex-shrink-0"></i>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ngày trả dự kiến */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  Ngày trả dự kiến
                </label>
                <input type="datetime-local"
                  className="input text-sm w-full"
                  value={estDate}
                  onChange={e => setEstDate(e.target.value)}
                />
              </div>

              {/* Ghi chú nội bộ */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  Ghi chú nội bộ
                  <span className="text-xs text-gray-400 font-normal ml-1">(khách không thấy)</span>
                </label>
                <textarea
                  rows={3}
                  className="input resize-none text-sm w-full"
                  placeholder="Chẩn đoán, linh kiện cần thay, chi phí sửa chữa..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium bg-gray-100 hover:bg-gray-200
              text-gray-600 rounded-xl transition-colors">
            Đóng
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 text-sm font-medium bg-indigo-500 hover:bg-indigo-600
              disabled:opacity-60 text-white rounded-xl transition-colors flex items-center justify-center gap-2">
            {saving
              ? <><i className="fa-solid fa-spinner fa-spin"></i>Đang lưu...</>
              : <><i className="fa-solid fa-floppy-disk"></i>Lưu thay đổi</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WarrantyAdminPage() {
  const queryClient = useQueryClient()
  const [page, setPage]         = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [keyword, setKeyword]   = useState('')
  const [selected, setSelected] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-warranty', page, filterStatus, keyword],
    queryFn: () => warrantyAPI.adminList({
      page, size: 15,
      status:  filterStatus || undefined,
      keyword: keyword || undefined,
    }).then(r => r.data),
    refetchInterval: 60000,
  })

  const handleUpdate = async (id, payload) => {
    try {
      const updated = await warrantyAPI.adminUpdate(id, payload).then(r => r.data)
      toast.success('Cập nhật thành công!')
      queryClient.invalidateQueries(['admin-warranty'])
      setSelected(updated)
    } catch {
      toast.error('Không thể cập nhật')
      throw new Error()
    }
  }

  // Đếm pending để hiện badge
  const pendingCount = data?.content?.filter(w => w.status === 'PENDING').length ?? 0

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-shield-halved text-indigo-500"></i>
            Bảo hành & Hậu mãi
            {pendingCount > 0 && (
              <span className="text-sm bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full">
                {pendingCount} mới
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {data?.totalElements || 0} yêu cầu
          </p>
        </div>
      </div>

      {/* Quick filter + search */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[240px]">
          <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input className="input pl-9 text-sm w-full"
            placeholder="Mã yêu cầu, tên KH, SĐT, sản phẩm, serial..."
            value={keyword}
            onChange={e => { setKeyword(e.target.value); setPage(0) }} />
        </div>
        <select className="input w-48 text-sm" value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(0) }}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Status pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[{ key: '', label: 'Tất cả' }]
          .concat(Object.entries(STATUS_CONFIG).map(([k, v]) => ({ key: k, label: v.label })))
          .map(item => (
            <button key={item.key}
              onClick={() => { setFilterStatus(item.key); setPage(0) }}
              className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full
                transition-colors border ${
                filterStatus === item.key
                  ? 'bg-indigo-500 text-white border-indigo-500'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}>
              {item.label}
            </button>
          ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Mã YC', 'Khách hàng', 'Sản phẩm', 'Loại', 'Trạng thái', 'Ngày tạo', 'Trả dự kiến', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400
                    px-4 py-3 uppercase tracking-wide whitespace-nowrap">{h}</th>
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
                : data?.content?.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-300">
                        <i className="fa-solid fa-shield-halved text-3xl mb-2 block"></i>
                        <p className="text-sm">Không có yêu cầu nào</p>
                      </td>
                    </tr>
                  )
                  : data?.content?.map(item => (
                    <tr key={item.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelected(item)}>

                      <td className="px-4 py-3">
                        <p className="text-sm font-mono font-bold text-gray-700">{item.requestCode}</p>
                        {item.orderCode && (
                          <p className="text-xs text-indigo-500 font-mono mt-0.5">{item.orderCode}</p>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800">{item.userName}</p>
                        <p className="text-xs text-gray-400">{item.userPhone || item.userEmail}</p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700 font-medium line-clamp-1 max-w-[160px]">
                          {item.productName}
                        </p>
                        {item.serialNumber && (
                          <p className="text-xs text-gray-400 font-mono">S/N: {item.serialNumber}</p>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <TypeBadge type={item.type} />
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {fmtDate(item.createdAt)}
                      </td>

                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {item.estimatedReturnDate
                          ? <span className="text-indigo-600 font-medium">
                              {fmtDate(item.estimatedReturnDate)}
                            </span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>

                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelected(item)}
                          className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-lg transition-colors">
                          <i className="fa-solid fa-arrow-up-right-from-square text-sm"></i>
                        </button>
                      </td>
                    </tr>
                  ))
              }
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
                  justify-center disabled:opacity-30 hover:bg-gray-50">
                <i className="fa-solid fa-chevron-left text-xs text-gray-500"></i>
              </button>
              {[...Array(Math.min(data.totalPages, 7))].map((_, i) => {
                const start = Math.max(0, Math.min(page - 3, data.totalPages - 7))
                const p = start + i
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === p ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {p + 1}
                  </button>
                )
              })}
              <button onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))}
                disabled={page === data.totalPages - 1}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center
                  justify-center disabled:opacity-30 hover:bg-gray-50">
                <i className="fa-solid fa-chevron-right text-xs text-gray-500"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <WarrantyDetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
