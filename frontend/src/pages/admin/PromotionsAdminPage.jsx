import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { couponAPI } from '../../services/api'
import toast from 'react-hot-toast'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt     = (p) => p != null ? new Intl.NumberFormat('vi-VN').format(p) + 'đ' : '—'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'
const fmtDateInput = (d) => d ? new Date(d).toISOString().slice(0, 16) : ''

const EMPTY_FORM = {
  code: '', description: '', discountType: 'PERCENT', discountValue: '',
  maxDiscountAmount: '', minOrderAmount: '', usageLimit: '', perUserLimit: '',
  active: true, startsAt: '', expiresAt: '',
}

// ── Status badge ──────────────────────────────────────────────────────────────
function CouponStatus({ coupon }) {
  const now = new Date()
  if (!coupon.active)
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">Tắt</span>
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now)
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-600">Hết hạn</span>
  if (coupon.startsAt && new Date(coupon.startsAt) > now)
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">Chưa bắt đầu</span>
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit)
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-600">Hết lượt</span>
  return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">Đang hoạt động</span>
}

// ── Form Modal ────────────────────────────────────────────────────────────────
function CouponFormModal({ editing, onClose, onSave }) {
  const [form, setForm]   = useState(editing ? {
    code:             editing.code,
    description:      editing.description || '',
    discountType:     editing.discountType,
    discountValue:    editing.discountValue?.toString() || '',
    maxDiscountAmount:editing.maxDiscountAmount?.toString() || '',
    minOrderAmount:   editing.minOrderAmount?.toString() || '',
    usageLimit:       editing.usageLimit?.toString() || '',
    perUserLimit:     editing.perUserLimit?.toString() || '',
    active:           editing.active ?? true,
    startsAt:         fmtDateInput(editing.startsAt),
    expiresAt:        fmtDateInput(editing.expiresAt),
  } : EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.code.trim())          { toast.error('Nhập mã coupon'); return }
    if (!form.discountValue)        { toast.error('Nhập giá trị giảm'); return }
    setSaving(true)
    try {
      const payload = {
        code:              form.code.toUpperCase().trim(),
        description:       form.description || null,
        discountType:      form.discountType,
        discountValue:     Number(form.discountValue),
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
        minOrderAmount:    form.minOrderAmount ? Number(form.minOrderAmount) : 0,
        usageLimit:        form.usageLimit ? Number(form.usageLimit) : null,
        perUserLimit:      form.perUserLimit ? Number(form.perUserLimit) : null,
        active:            form.active,
        startsAt:          form.startsAt ? new Date(form.startsAt).toISOString() : null,
        expiresAt:         form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      }
      await onSave(payload)
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <i className={`fa-solid ${editing ? 'fa-pen-to-square text-blue-500' : 'fa-plus text-emerald-500'}`}></i>
            {editing ? 'Chỉnh sửa coupon' : 'Tạo coupon mới'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Mã coupon */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã coupon *</label>
              <input className="input uppercase" placeholder="VD: SUMMER20"
                value={form.code}
                onChange={e => set('code', e.target.value.toUpperCase())}
                disabled={!!editing} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm *</label>
              <select className="input" value={form.discountType} onChange={e => set('discountType', e.target.value)}>
                <option value="PERCENT">Phần trăm (%)</option>
                <option value="FIXED">Cố định (đ)</option>
              </select>
            </div>
          </div>

          {/* Giá trị */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá trị giảm * {form.discountType === 'PERCENT' ? '(%)' : '(đ)'}
              </label>
              <input type="number" min="0" className="input"
                placeholder={form.discountType === 'PERCENT' ? 'VD: 20' : 'VD: 50000'}
                value={form.discountValue}
                onChange={e => set('discountValue', e.target.value)} />
            </div>
            {form.discountType === 'PERCENT' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giảm tối đa (đ)</label>
                <input type="number" min="0" className="input" placeholder="Không giới hạn"
                  value={form.maxDiscountAmount}
                  onChange={e => set('maxDiscountAmount', e.target.value)} />
              </div>
            )}
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <input className="input" placeholder="VD: Giảm 20% cho đơn từ 500k"
              value={form.description}
              onChange={e => set('description', e.target.value)} />
          </div>

          {/* Điều kiện */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu (đ)</label>
              <input type="number" min="0" className="input" placeholder="0"
                value={form.minOrderAmount}
                onChange={e => set('minOrderAmount', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tổng lượt dùng</label>
              <input type="number" min="1" className="input" placeholder="Không giới hạn"
                value={form.usageLimit}
                onChange={e => set('usageLimit', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lượt/người dùng</label>
            <input type="number" min="1" className="input w-1/2" placeholder="Không giới hạn"
              value={form.perUserLimit}
              onChange={e => set('perUserLimit', e.target.value)} />
          </div>

          {/* Thời gian */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu</label>
              <input type="datetime-local" className="input text-sm"
                value={form.startsAt}
                onChange={e => set('startsAt', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hết hạn</label>
              <input type="datetime-local" className="input text-sm"
                value={form.expiresAt}
                onChange={e => set('expiresAt', e.target.value)} />
            </div>
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={form.active}
                onChange={e => set('active', e.target.checked)} />
              <div className={`w-10 h-6 rounded-full transition-colors ${form.active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">Kích hoạt ngay</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl">
            Huỷ
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white rounded-xl flex items-center justify-center gap-2">
            {saving ? <><i className="fa-solid fa-spinner fa-spin"></i>Đang lưu...</> : <><i className="fa-solid fa-floppy-disk"></i>Lưu</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PromotionsAdminPage() {
  const queryClient = useQueryClient()
  const [page, setPage]         = useState(0)
  const [keyword, setKeyword]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons', page, keyword],
    queryFn:  () => couponAPI.adminList({ page, size: 15, keyword: keyword || undefined }).then(r => r.data),
  })

  const handleSave = async (payload) => {
    try {
      if (editing) {
        await couponAPI.adminUpdate(editing.id, payload)
        toast.success('Cập nhật thành công!')
      } else {
        await couponAPI.adminCreate(payload)
        toast.success('Tạo coupon thành công!')
      }
      queryClient.invalidateQueries(['admin-coupons'])
      setShowForm(false)
      setEditing(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi lưu coupon')
      throw err
    }
  }

  const handleDelete = async (id, code) => {
    if (!confirm(`Xoá coupon "${code}"?`)) return
    try {
      await couponAPI.adminDelete(id)
      toast.success('Đã xoá coupon')
      queryClient.invalidateQueries(['admin-coupons'])
    } catch { toast.error('Không thể xoá') }
  }

  const openCreate = () => { setEditing(null); setShowForm(true) }
  const openEdit   = (c) => { setEditing(c); setShowForm(true) }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-ticket text-indigo-500"></i>Khuyến mãi
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{data?.totalElements || 0} coupon</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <i className="fa-solid fa-plus"></i>Tạo coupon
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="relative">
          <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input className="input pl-9" placeholder="Tìm mã coupon, mô tả..."
            value={keyword} onChange={e => { setKeyword(e.target.value); setPage(0) }} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Mã coupon', 'Loại giảm', 'Điều kiện', 'Lượt dùng', 'Thời hạn', 'Trạng thái', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 px-4 py-3 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? [...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                      ))}
                    </tr>
                  ))
                : data?.content?.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-300">
                        <i className="fa-solid fa-ticket text-3xl mb-2 block"></i>
                        <p className="text-sm">Chưa có coupon nào</p>
                      </td>
                    </tr>
                  )
                  : data?.content?.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">

                      <td className="px-4 py-3">
                        <p className="text-sm font-mono font-bold text-gray-800">{c.code}</p>
                        {c.description && <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`text-sm font-bold ${c.discountType === 'PERCENT' ? 'text-indigo-600' : 'text-emerald-600'}`}>
                          {c.discountType === 'PERCENT'
                            ? `${c.discountValue}%`
                            : fmt(c.discountValue)}
                        </span>
                        {c.discountType === 'PERCENT' && c.maxDiscountAmount && (
                          <p className="text-xs text-gray-400">Tối đa {fmt(c.maxDiscountAmount)}</p>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-500">
                        {c.minOrderAmount > 0
                          ? <span>Đơn từ {fmt(c.minOrderAmount)}</span>
                          : <span className="text-gray-300">Không giới hạn</span>}
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-700">
                          <span className="font-semibold">{c.usedCount}</span>
                          {c.usageLimit != null && <span className="text-gray-400"> / {c.usageLimit}</span>}
                        </div>
                        {c.usageLimit != null && (
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-indigo-400 rounded-full transition-all"
                              style={{ width: `${Math.min(100, (c.usedCount / c.usageLimit) * 100)}%` }} />
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {c.expiresAt ? (
                          <span className={new Date(c.expiresAt) < new Date() ? 'text-rose-500' : ''}>
                            {fmtDate(c.expiresAt)}
                          </span>
                        ) : (
                          <span className="text-gray-300">Vĩnh viễn</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <CouponStatus coupon={c} />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openEdit(c)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                            <i className="fa-solid fa-pen-to-square text-sm"></i>
                          </button>
                          <button onClick={() => handleDelete(c.id, c.code)}
                            className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors">
                            <i className="fa-solid fa-trash text-sm"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {data?.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
            <p className="text-xs text-gray-400">Trang {page + 1} / {data.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-30">
                <i className="fa-solid fa-chevron-left text-xs text-gray-500"></i>
              </button>
              {[...Array(Math.min(data.totalPages, 7))].map((_, i) => {
                const start = Math.max(0, Math.min(page - 3, data.totalPages - 7))
                const p = start + i
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium ${page === p ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {p + 1}
                  </button>
                )
              })}
              <button onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))} disabled={page === data.totalPages - 1}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-30">
                <i className="fa-solid fa-chevron-right text-xs text-gray-500"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <CouponFormModal
          editing={editing}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
