import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { inventoryAPI, productAPI } from '../../services/api'
import toast from 'react-hot-toast'

// ── Config ────────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  IMPORT: { label: 'Nhập kho',    color: 'bg-emerald-100 text-emerald-700', icon: 'fa-arrow-down',   sign: '+' },
  EXPORT: { label: 'Xuất kho',    color: 'bg-rose-100 text-rose-600',       icon: 'fa-arrow-up',     sign: '-' },
  ADJUST: { label: 'Điều chỉnh', color: 'bg-amber-100 text-amber-700',     icon: 'fa-sliders',      sign: '=' },
}

const fmt     = (p) => p != null ? new Intl.NumberFormat('vi-VN').format(p) + 'đ' : '—'
const fmtDate = (d) => d ? new Date(d).toLocaleString('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
}) : '—'

// ── Add Stock Modal ───────────────────────────────────────────────────────────
function AddStockModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    productId: '', type: 'IMPORT', quantity: '',
    unitCost: '', supplier: '', note: '',
  })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const { data: products } = useQuery({
    queryKey: ['products-search', search],
    queryFn:  () => productAPI.getAll({ keyword: search || undefined, size: 8 }).then(r => r.data),
    enabled:  true,
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const selectedProduct = products?.content?.find(p => p.id === Number(form.productId))

  const handleSave = async () => {
    if (!form.productId) { toast.error('Chọn sản phẩm'); return }
    if (!form.quantity || Number(form.quantity) < 1) { toast.error('Số lượng phải lớn hơn 0'); return }
    setSaving(true)
    try {
      await onSave({
        productId: Number(form.productId),
        type:      form.type,
        quantity:  Number(form.quantity),
        unitCost:  form.unitCost ? Number(form.unitCost) : null,
        supplier:  form.supplier || null,
        note:      form.note || null,
      })
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-warehouse text-indigo-500"></i>Nhập / Xuất kho
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Loại giao dịch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loại giao dịch *</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <button key={key} type="button"
                  onClick={() => set('type', key)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.type === key
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                      : 'border-gray-100 hover:border-gray-200 text-gray-600'
                  }`}>
                  <i className={`fa-solid ${cfg.icon} text-base`}></i>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tìm sản phẩm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sản phẩm *</label>
            <input className="input mb-2" placeholder="Tìm theo tên sản phẩm..."
              value={search} onChange={e => setSearch(e.target.value)} />

            {products?.content?.length > 0 && (
              <div className="border border-gray-100 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                {products.content.map(p => (
                  <button key={p.id} type="button"
                    onClick={() => { set('productId', p.id.toString()); setSearch(p.name) }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left ${
                      form.productId === p.id.toString() ? 'bg-indigo-50' : ''
                    }`}>
                    <div className="w-9 h-9 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {p.imageUrl
                        ? <img src={p.imageUrl} className="w-full h-full object-cover" crossOrigin="anonymous" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <i className="fa-solid fa-image text-gray-300 text-xs"></i>
                          </div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">Tồn: <span className={`font-semibold ${
                        p.stockQty === 0 ? 'text-rose-500' : p.stockQty < 10 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>{p.stockQty}</span></p>
                    </div>
                    {form.productId === p.id.toString() && (
                      <i className="fa-solid fa-check text-indigo-500 text-sm flex-shrink-0"></i>
                    )}
                  </button>
                ))}
              </div>
            )}

            {selectedProduct && (
              <div className="mt-2 px-3 py-2 bg-indigo-50 rounded-xl text-xs text-indigo-700 flex items-center gap-2">
                <i className="fa-solid fa-circle-check"></i>
                Đã chọn: <span className="font-bold">{selectedProduct.name}</span>
                — Tồn kho hiện tại: <span className="font-bold">{selectedProduct.stockQty}</span>
              </div>
            )}
          </div>

          {/* Số lượng */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form.type === 'ADJUST' ? 'Tồn kho mới *' : 'Số lượng *'}
              </label>
              <input type="number" min="1" className="input"
                placeholder={form.type === 'ADJUST' ? 'Nhập số tồn kho mới' : 'VD: 50'}
                value={form.quantity}
                onChange={e => set('quantity', e.target.value)} />
            </div>
            {form.type === 'IMPORT' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá nhập (đ)</label>
                <input type="number" min="0" className="input" placeholder="Giá nhập/đơn vị"
                  value={form.unitCost}
                  onChange={e => set('unitCost', e.target.value)} />
              </div>
            )}
          </div>

          {/* Nhà cung cấp + ghi chú */}
          {form.type === 'IMPORT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
              <input className="input" placeholder="VD: Samsung Vietnam"
                value={form.supplier}
                onChange={e => set('supplier', e.target.value)} />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea rows={2} className="input resize-none" placeholder="Ghi chú nội bộ..."
              value={form.note}
              onChange={e => set('note', e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl">
            Huỷ
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white rounded-xl flex items-center justify-center gap-2">
            {saving ? <><i className="fa-solid fa-spinner fa-spin"></i>Đang lưu...</> : <><i className="fa-solid fa-floppy-disk"></i>Xác nhận</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function InventoryAdminPage() {
  const queryClient = useQueryClient()
  const [page, setPage]         = useState(0)
  const [keyword, setKeyword]   = useState('')
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-inventory', page, keyword],
    queryFn:  () => inventoryAPI.listAll({ page, size: 20, keyword: keyword || undefined }).then(r => r.data),
    refetchInterval: 60000,
  })

  const handleSave = async (payload) => {
    try {
      await inventoryAPI.addTransaction(payload)
      toast.success('Cập nhật kho thành công!')
      queryClient.invalidateQueries(['admin-inventory'])
      queryClient.invalidateQueries(['admin-products'])
      queryClient.invalidateQueries(['dashboard'])
      setShowForm(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật kho')
      throw err
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-warehouse text-indigo-500"></i>Kho hàng
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{data?.totalElements || 0} giao dịch</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <i className="fa-solid fa-plus"></i>Nhập / Xuất kho
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="relative">
          <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input className="input pl-9" placeholder="Tìm theo tên SP, SKU, nhà cung cấp..."
            value={keyword} onChange={e => { setKeyword(e.target.value); setPage(0) }} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Sản phẩm', 'Loại', 'Số lượng', 'Tồn sau', 'Giá nhập', 'Nhà cung cấp', 'Ghi chú', 'Thời gian', 'Thực hiện'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 px-4 py-3 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? [...Array(8)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(9)].map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                      ))}
                    </tr>
                  ))
                : data?.content?.length === 0
                  ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-gray-300">
                        <i className="fa-solid fa-warehouse text-3xl mb-2 block"></i>
                        <p className="text-sm">Chưa có giao dịch kho nào</p>
                      </td>
                    </tr>
                  )
                  : data?.content?.map(t => {
                    const cfg = TYPE_CONFIG[t.type] || TYPE_CONFIG.IMPORT
                    return (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {t.productImage
                                ? <img src={t.productImage} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                : <div className="w-full h-full flex items-center justify-center">
                                    <i className="fa-solid fa-image text-gray-300 text-xs"></i>
                                  </div>
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate max-w-[160px]">{t.productName}</p>
                              {t.productSku && <p className="text-xs text-gray-400">{t.productSku}</p>}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                            <i className={`fa-solid ${cfg.icon} text-[10px]`}></i>{cfg.label}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className={`text-sm font-bold ${
                            t.type === 'IMPORT' ? 'text-emerald-600'
                            : t.type === 'EXPORT' ? 'text-rose-600'
                            : 'text-amber-600'
                          }`}>
                            {cfg.sign}{t.quantity}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className={`text-sm font-semibold ${
                            t.stockAfter === 0   ? 'text-rose-500'
                            : t.stockAfter < 10  ? 'text-amber-600'
                            :                      'text-gray-700'
                          }`}>
                            {t.stockAfter}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-600">
                          {t.unitCost ? fmt(t.unitCost) : <span className="text-gray-300">—</span>}
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-600">
                          {t.supplier || <span className="text-gray-300">—</span>}
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px]">
                          <p className="truncate">{t.note || <span className="text-gray-300">—</span>}</p>
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {fmtDate(t.createdAt)}
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-400">
                          {t.createdBy?.split('@')[0] || '—'}
                        </td>
                      </tr>
                    )
                  })
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
        <AddStockModal
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
