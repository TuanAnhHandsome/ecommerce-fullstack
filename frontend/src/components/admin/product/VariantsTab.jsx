import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { variantAPI } from '../../../services/api'
import toast from 'react-hot-toast'

/**
 * VariantsTab – quản lý biến thể sản phẩm.
 *
 * Fix các lỗi:
 * 1. Biến thể tăng gấp đôi khi lưu: gửi kèm existingId cho backend biết
 *    đây là UPDATE hay INSERT.
 * 2. Có thể xóa từng SKU riêng lẻ.
 * 3. Có thể thêm option/value mới sau khi đã có SKU.
 */
export default function VariantsTab({ productId }) {
  // options: [{ tempId, existingId?, name, values: [{ tempId, existingId?, value }] }]
  const [options, setOptions] = useState([])
  // skus: [{ tempId, existingId?, valueLabels, price, salePrice, stockQty, sku, active,
  //          images: [{file,preview}], existingImages: [{url}], deleted?: true }]
  const [skus, setSkus] = useState([])
  const [saving, setSaving] = useState(false)
  const fileRefs = useRef({})
  const queryClient = useQueryClient()

  const { data: existingVariants, isLoading } = useQuery({
    queryKey: ['variants', productId],
    queryFn: () => productId ? variantAPI.getByProduct(productId).then(r => r.data) : null,
    enabled: !!productId,
  })

  // Load existing → state (chỉ chạy 1 lần khi data về)
  useEffect(() => {
    if (!existingVariants) return

    if (existingVariants.variantOptions?.length) {
      setOptions(existingVariants.variantOptions.map(opt => ({
        tempId: `opt-${opt.id}`,
        existingId: opt.id,
        name: opt.name,
        values: opt.values.map(v => ({
          tempId: `val-${v.id}`,
          existingId: v.id,
          value: v.value,
        }))
      })))
    }

    if (existingVariants.variants?.length) {
      setSkus(existingVariants.variants.map(v => ({
        tempId: `sku-${v.id}`,
        existingId: v.id,           // ← quan trọng: dùng để backend update thay vì insert
        valueLabels: v.valueLabels ?? [],
        price: v.price?.toString() ?? '',
        salePrice: v.salePrice?.toString() ?? '',
        stockQty: v.stockQty?.toString() ?? '0',
        sku: v.sku ?? '',
        active: v.active !== false,
        images: [],
        existingImages: v.images?.map(url => ({ url })) ?? [],
        deleted: false,
      })))
    }
  }, [existingVariants])

  // ── Helpers: Options ──────────────────────────────────────────────────────
  const addOption = () => setOptions(o => [...o, {
    tempId: `opt-new-${Date.now()}`,
    name: '',
    values: [{ tempId: `val-new-${Date.now()}`, value: '' }]
  }])

  const updateOptionName = (optId, name) =>
    setOptions(o => o.map(opt => opt.tempId === optId ? { ...opt, name } : opt))

  const removeOption = (optId) =>
    setOptions(o => o.filter(opt => opt.tempId !== optId))

  const addValue = (optId) =>
    setOptions(o => o.map(opt =>
      opt.tempId === optId
        ? { ...opt, values: [...opt.values, { tempId: `val-new-${Date.now()}`, value: '' }] }
        : opt
    ))

  const updateValue = (optId, valId, value) =>
    setOptions(o => o.map(opt =>
      opt.tempId === optId
        ? { ...opt, values: opt.values.map(v => v.tempId === valId ? { ...v, value } : v) }
        : opt
    ))

  const removeValue = (optId, valId) =>
    setOptions(o => o.map(opt =>
      opt.tempId === optId
        ? { ...opt, values: opt.values.filter(v => v.tempId !== valId) }
        : opt
    ))

  // ── SKU auto-generate ─────────────────────────────────────────────────────
  const cartesian = (arrays) =>
    arrays.length === 0 ? [] :
      arrays.reduce((acc, curr) => acc.flatMap(a => curr.map(b => [...a, b])), [[]])

  const rebuildSkus = () => {
    const validOptions = options.filter(o => o.name.trim() && o.values.some(v => v.value.trim()))
    if (!validOptions.length) { setSkus([]); return }

    const validValues = validOptions.map(o => o.values.filter(v => v.value.trim()).map(v => v.value.trim()))
    const combos = cartesian(validValues)

    setSkus(prev => combos.map(combo => {
      const key = combo.join('|')
      // Giữ lại SKU cũ nếu combo giống hệt (kể cả existingId)
      const existing = prev.find(s => !s.deleted && s.valueLabels.join('|') === key)
      return existing || {
        tempId: `sku-new-${Date.now()}-${Math.random()}`,
        valueLabels: combo,
        price: '', salePrice: '', stockQty: '0',
        sku: '', active: true,
        images: [], existingImages: [],
        deleted: false,
      }
    }))
  }

  // ── Helpers: SKUs ─────────────────────────────────────────────────────────
  const updateSku = (tempId, field, value) =>
    setSkus(s => s.map(sk => sk.tempId === tempId ? { ...sk, [field]: value } : sk))

  const toggleSkuActive = (tempId) =>
    setSkus(s => s.map(sk => sk.tempId === tempId ? { ...sk, active: !sk.active } : sk))

  // Xóa mềm: đánh dấu deleted=true, backend sẽ xử lý
  const deleteSku = (tempId) =>
    setSkus(s => s.map(sk => sk.tempId === tempId ? { ...sk, deleted: true } : sk))

  const addSkuImages = (tempId, files) => {
    const added = Array.from(files).map(file => ({ file, preview: URL.createObjectURL(file) }))
    setSkus(s => s.map(sk => sk.tempId === tempId
      ? { ...sk, images: [...sk.images, ...added] } : sk))
  }

  const removeSkuNewImage = (skuTempId, imgIdx) =>
    setSkus(s => s.map(sk => {
      if (sk.tempId !== skuTempId) return sk
      URL.revokeObjectURL(sk.images[imgIdx].preview)
      return { ...sk, images: sk.images.filter((_, i) => i !== imgIdx) }
    }))

  const removeSkuExistingImage = (skuTempId, imgIdx) =>
    setSkus(s => s.map(sk =>
      sk.tempId !== skuTempId ? sk
        : { ...sk, existingImages: sk.existingImages.filter((_, i) => i !== imgIdx) }
    ))

  // ── Save ──────────────────────────────────────────────────────────────────
  // ── handleSave (thay thế hàm cũ trong VariantsTab.jsx) ───────────────────────
  //
  // Vấn đề cũ:
  //   - SKU mới (chưa có existingId) → key dùng valueLabels.join('|')
  //     nhưng backend lúc đó chưa biết ID → không map được ảnh
  //
  // Fix:
  //   - Gửi 2 bước:
  //     Bước 1: POST data (không kèm ảnh) → backend trả về list {tempKey, variantId}
  //     Bước 2: Upload ảnh với key = variantId thực từ backend
  //
  // Hoặc (đơn giản hơn, không cần đổi API):
  //   - Dùng index thứ tự (0, 1, 2…) làm key, backend map theo sortOrder
  //
  // ─── PHƯƠNG ÁN DÙNG INDEX (đơn giản, không cần thay đổi API response) ────────

  const handleSave = async () => {
    if (!productId) { toast.error('Lưu thông tin sản phẩm trước'); return }

    const activeSkus = skus.filter(s => !s.deleted)
    if (!activeSkus.length) { toast.error('Chưa có SKU nào'); return }
    if (activeSkus.find(s => !s.price)) { toast.error('Mỗi SKU cần có giá'); return }

    setSaving(true)
    try {
      const fd = new FormData()

      // Toàn bộ skus (kể cả deleted) để backend biết xóa cái nào
      const payload = {
        options: options.filter(o => o.name.trim()).map((o, oi) => ({
          id: o.existingId ?? null,
          name: o.name.trim(),
          sortOrder: oi,
          values: o.values.filter(v => v.value.trim()).map((v, vi) => ({
            id: v.existingId ?? null,
            value: v.value.trim(),
            sortOrder: vi,
          }))
        })),
        skus: skus.map((sk, i) => ({
          id: sk.existingId ?? null,
          deleted: sk.deleted ?? false,
          sku: sk.sku || null,
          price: sk.deleted ? 0 : Number(sk.price),
          salePrice: sk.deleted ? null : (sk.salePrice ? Number(sk.salePrice) : null),
          stockQty: sk.deleted ? 0 : Number(sk.stockQty),
          active: sk.active,
          sortOrder: i,                                     // ← index = key cho ảnh
          valueLabels: sk.valueLabels,
          keepImageUrls: sk.existingImages.map(img => img.url),
        }))
      }

      fd.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))

      // KEY = sortOrder (index) của SKU trong mảng
      // Backend dùng sortOrder để tìm đúng SKU mà gán ảnh vào
      skus.forEach((sk, i) => {
        if (!sk.images.length || sk.deleted) return
        sk.images.forEach(({ file }) => {
          fd.append(`images[${i}]`, file)   // key = index (0,1,2…)
        })
      })

      await variantAPI.save(productId, fd)
      toast.success('Đã lưu biến thể!')
      queryClient.invalidateQueries(['variants', productId])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi lưu biến thể')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return (
    <div className="py-8 text-center text-gray-400">
      <i className="fa-solid fa-spinner fa-spin mr-2"></i>Đang tải...
    </div>
  )

  const activeSkus = skus.filter(s => !s.deleted)

  return (
    <div className="space-y-6">

      {/* ── Step 1: Options ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-700">
              <i className="fa-solid fa-sliders mr-1.5 text-gray-400"></i>
              Bước 1 — Loại biến thể
            </p>
            <p className="text-xs text-gray-400 mt-0.5">VD: Màu sắc → Đen, Bạc | RAM → 8GB, 16GB</p>
          </div>
          <button type="button" onClick={addOption}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors">
            <i className="fa-solid fa-plus"></i>Thêm loại
          </button>
        </div>

        {options.length === 0 && (
          <div className="border-2 border-dashed border-gray-200 rounded-xl py-6 text-center text-gray-400 text-sm">
            Chưa có biến thể — nhấn "Thêm loại" để bắt đầu
          </div>
        )}

        <div className="space-y-3">
          {options.map(opt => (
            <div key={opt.tempId} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <input
                  className="input flex-1 text-sm font-medium bg-white"
                  placeholder="Tên loại (VD: Màu sắc, RAM)"
                  value={opt.name}
                  onChange={e => updateOptionName(opt.tempId, e.target.value)}
                />
                <button type="button" onClick={() => removeOption(opt.tempId)}
                  className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Xoá loại này">
                  <i className="fa-solid fa-trash text-sm"></i>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {opt.values.map(val => (
                  <div key={val.tempId} className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
                    <input
                      className="text-sm outline-none w-24 min-w-0"
                      placeholder="Giá trị..."
                      value={val.value}
                      onChange={e => updateValue(opt.tempId, val.tempId, e.target.value)}
                      onBlur={rebuildSkus}
                    />
                    {opt.values.length > 1 && (
                      <button type="button"
                        onClick={() => { removeValue(opt.tempId, val.tempId); setTimeout(rebuildSkus, 50) }}
                        className="text-gray-300 hover:text-red-400 transition-colors">
                        <i className="fa-solid fa-xmark text-xs"></i>
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addValue(opt.tempId)}
                  className="flex items-center gap-1 text-xs px-2 py-1 text-blue-500 hover:bg-blue-50 rounded-lg border border-dashed border-blue-200 transition-colors">
                  <i className="fa-solid fa-plus text-xs"></i>Thêm
                </button>
              </div>
            </div>
          ))}
        </div>

        {options.length > 0 && (
          <button type="button" onClick={rebuildSkus}
            className="mt-3 w-full py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors flex items-center justify-center gap-2">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            Tạo / làm mới danh sách SKU
          </button>
        )}
      </div>

      {/* ── Step 2: SKUs ── */}
      {activeSkus.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">
            <i className="fa-solid fa-table mr-1.5 text-gray-400"></i>
            Bước 2 — Cấu hình từng SKU
            <span className="ml-2 text-xs font-normal text-gray-400">({activeSkus.length} SKU)</span>
          </p>

          <div className="space-y-3">
            {activeSkus.map(sk => (
              <div key={sk.tempId}
                className={`border rounded-xl overflow-hidden transition-all ${sk.active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>

                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <div className="flex gap-1.5 flex-wrap flex-1">
                    {sk.valueLabels.map((lbl, i) => (
                      <span key={i} className="text-xs font-semibold px-2 py-0.5 bg-white border border-gray-200 rounded-md text-gray-700">
                        {lbl}
                      </span>
                    ))}
                    {sk.existingId && (
                      <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-md font-medium">
                        <i className="fa-solid fa-circle-check mr-1"></i>Đã lưu
                      </span>
                    )}
                  </div>

                  {/* Toggle active */}
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={sk.active}
                        onChange={() => toggleSkuActive(sk.tempId)} />
                      <div className={`w-8 h-[18px] rounded-full transition-colors ${sk.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${sk.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                    {sk.active ? 'Đang bán' : 'Tắt'}
                  </label>

                  {/* Xóa SKU này */}
                  <button type="button" onClick={() => deleteSku(sk.tempId)}
                    title="Xoá SKU này"
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                    <i className="fa-solid fa-trash text-xs"></i>
                  </button>
                </div>

                {/* Fields */}
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Giá gốc (đ) *</label>
                    <input type="number" min="0" className="input text-sm" value={sk.price}
                      onChange={e => updateSku(sk.tempId, 'price', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Giá sale (đ)</label>
                    <input type="number" min="0" className="input text-sm" value={sk.salePrice}
                      placeholder="Không giảm"
                      onChange={e => updateSku(sk.tempId, 'salePrice', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tồn kho</label>
                    <input type="number" min="0" className="input text-sm" value={sk.stockQty}
                      onChange={e => updateSku(sk.tempId, 'stockQty', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">SKU code</label>
                    <input className="input text-sm" value={sk.sku}
                      placeholder="Tự động nếu để trống"
                      onChange={e => updateSku(sk.tempId, 'sku', e.target.value)} />
                  </div>
                </div>

                {/* Images */}
                <div className="px-4 pb-4">
                  <label className="block text-xs text-gray-500 mb-2">
                    <i className="fa-solid fa-images mr-1"></i>
                    Ảnh riêng của biến thể
                    <span className="ml-1 text-gray-400">(sẽ được đồng bộ vào ảnh sản phẩm)</span>
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {sk.existingImages.map((img, i) => (
                      <div key={`ex-${i}`} className="relative group w-16 h-16 rounded-lg overflow-hidden border-2 border-green-200">
                        <img src={img.url} className="w-full h-full object-cover"
                          crossOrigin="anonymous" referrerPolicy="no-referrer" />
                        <button type="button"
                          onClick={() => removeSkuExistingImage(sk.tempId, i)}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <i className="fa-solid fa-trash text-white text-xs"></i>
                        </button>
                      </div>
                    ))}
                    {sk.images.map((img, i) => (
                      <div key={`new-${i}`} className="relative group w-16 h-16 rounded-lg overflow-hidden border-2 border-blue-200">
                        <img src={img.preview} className="w-full h-full object-cover"
                          crossOrigin="anonymous" referrerPolicy="no-referrer" />
                        <button type="button"
                          onClick={() => removeSkuNewImage(sk.tempId, i)}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <i className="fa-solid fa-trash text-white text-xs"></i>
                        </button>
                      </div>
                    ))}
                    <button type="button"
                      onClick={() => fileRefs.current[sk.tempId]?.click()}
                      className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 transition-colors">
                      <i className="fa-solid fa-plus text-sm"></i>
                    </button>
                    <input
                      ref={el => fileRefs.current[sk.tempId] = el}
                      type="file" accept="image/*" multiple className="hidden"
                      onChange={e => { addSkuImages(sk.tempId, e.target.files); e.target.value = '' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save */}
      {(activeSkus.length > 0 || options.length > 0) && (
        <button type="button" onClick={handleSave} disabled={saving}
          className="w-full py-3 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 rounded-xl transition-colors flex items-center justify-center gap-2">
          {saving
            ? <><i className="fa-solid fa-spinner fa-spin"></i>Đang lưu...</>
            : <><i className="fa-solid fa-floppy-disk"></i>Lưu biến thể ({activeSkus.length} SKU)</>
          }
        </button>
      )}
    </div>
  )
}