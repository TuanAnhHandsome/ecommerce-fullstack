import { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { productAPI, categoryAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function ProductsAdminPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name:'', categoryId:'', price:'', salePrice:'', stockQty:'', sku:'', description:'', active:true })

  // Ảnh hiện có (URL từ server) — dùng khi đang sửa
  const [existingImages, setExistingImages] = useState([])  // [{ url, id? }]
  // Ảnh mới được chọn thêm (File objects)
  const [newImages, setNewImages] = useState([])             // [{ file, preview }]
  // Danh sách id ảnh cũ bị xoá
  const [deletedImageIds, setDeletedImageIds] = useState([])

  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  const { data } = useQuery({
    queryKey: ['admin-products', page, keyword],
    queryFn: () => productAPI.getAll({ page, size: 15, keyword: keyword || undefined, sortBy: 'createdAt', sortDir: 'desc' }).then(r => r.data),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getAll().then(r => r.data),
  })

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p) + 'đ'

  const resetImageState = () => {
    setExistingImages([])
    setNewImages([])
    setDeletedImageIds([])
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ name:'', categoryId:'', price:'', salePrice:'', stockQty:'', sku:'', description:'', active:true })
    resetImageState()
    setShowForm(true)
  }

  const openEdit = (p) => {
    setEditing(p)
    setForm({ name:p.name, categoryId:p.categoryId||'', price:p.price, salePrice:p.salePrice||'', stockQty:p.stockQty, sku:p.sku||'', description:p.description||'', active:p.active })
    resetImageState()
    // Hỗ trợ cả mảng images lẫn imageUrl đơn
    if (p.images?.length) {
      setExistingImages(p.images.map(img =>
        typeof img === 'string' ? { url: img } : img
      ))
    } else if (p.imageUrl) {
      setExistingImages([{ url: p.imageUrl }])
    }
    setShowForm(true)
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const added = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setNewImages(prev => [...prev, ...added])
    // reset input để có thể chọn lại cùng file
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeExistingImage = (idx) => {
    const img = existingImages[idx]
    if (img.id) setDeletedImageIds(prev => [...prev, img.id])
    setExistingImages(prev => prev.filter((_, i) => i !== idx))
  }

  const removeNewImage = (idx) => {
    setNewImages(prev => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const totalImages = existingImages.length + newImages.length

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('product', new Blob([JSON.stringify({
        ...form,
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        stockQty: Number(form.stockQty),
        categoryId: Number(form.categoryId),
        deletedImageIds: deletedImageIds.length ? deletedImageIds : undefined,
      })], { type: 'application/json' }))

      newImages.forEach(({ file }) => fd.append('images', file))

      if (editing) {
        await productAPI.update(editing.id, fd)
        toast.success('Cập nhật sản phẩm thành công!')
      } else {
        await productAPI.create(fd)
        toast.success('Thêm sản phẩm thành công!')
      }
      queryClient.invalidateQueries(['admin-products'])
      setShowForm(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi lưu sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Ẩn sản phẩm "${name}"?`)) return
    try {
      await productAPI.delete(id)
      toast.success('Đã ẩn sản phẩm')
      queryClient.invalidateQueries(['admin-products'])
    } catch { toast.error('Không thể ẩn sản phẩm') }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-box text-red-500"></i>Quản lý sản phẩm
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{data?.totalElements || 0} sản phẩm</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <i className="fa-solid fa-plus"></i>Thêm sản phẩm
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex gap-3">
        <div className="relative flex-1">
          <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input className="input pl-9" placeholder="Tìm theo tên sản phẩm..."
            value={keyword} onChange={e => { setKeyword(e.target.value); setPage(0) }} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Sản phẩm', 'Danh mục', 'Giá', 'Tồn kho', 'Trạng thái', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.content?.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        {p.imageUrl
                          ? <img src={p.imageUrl} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center">
                              <i className="fa-solid fa-image text-gray-300"></i>
                            </div>
                        }
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 line-clamp-1 max-w-[200px]">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.sku || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.categoryName}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-red-500">{formatPrice(p.effectivePrice)}</p>
                    {p.salePrice && <p className="text-xs text-gray-400 line-through">{formatPrice(p.price)}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-semibold ${p.stockQty === 0 ? 'text-red-500' : p.stockQty < 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {p.stockQty === 0
                        ? <><i className="fa-solid fa-circle-xmark mr-1"></i>Hết</>
                        : <><i className="fa-solid fa-circle-check mr-1"></i>{p.stockQty}</>
                      }
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.active ? <><i className="fa-solid fa-eye mr-1"></i>Hiển thị</> : <><i className="fa-solid fa-eye-slash mr-1"></i>Ẩn</>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(p)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa">
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Ẩn">
                        <i className="fa-solid fa-eye-slash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data?.totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-50">
            {[...Array(data.totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className={`w-8 h-8 rounded-lg text-sm font-medium ${page===i ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {i+1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal Form ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <i className={`fa-solid ${editing ? 'fa-pen-to-square text-blue-500' : 'fa-plus text-green-500'}`}></i>
                {editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h2>
              <button onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {/* ── Image management section ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    <i className="fa-solid fa-images mr-1 text-gray-400"></i>
                    Ảnh sản phẩm
                    {totalImages > 0 && (
                      <span className="ml-1.5 text-xs font-normal text-gray-400">({totalImages} ảnh)</span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium"
                  >
                    <i className="fa-solid fa-plus"></i>Thêm ảnh
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                {/* Image grid */}
                {totalImages > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {/* Existing images */}
                    {existingImages.map((img, i) => (
                      <div key={`existing-${i}`} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        {/* Badge "ảnh hiện có" */}
                        <div className="absolute top-1 left-1 bg-green-500/80 text-white text-[10px] px-1.5 py-0.5 rounded-md font-medium leading-tight">
                          Hiện có
                        </div>
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeExistingImage(i)}
                          className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <i className="fa-solid fa-xmark text-[10px]"></i>
                        </button>
                      </div>
                    ))}

                    {/* New images being added */}
                    {newImages.map((img, i) => (
                      <div key={`new-${i}`} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-blue-300">
                        <img src={img.preview} alt="" className="w-full h-full object-cover" />
                        {/* Badge "mới" */}
                        <div className="absolute top-1 left-1 bg-blue-500/80 text-white text-[10px] px-1.5 py-0.5 rounded-md font-medium leading-tight">
                          Mới
                        </div>
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeNewImage(i)}
                          className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <i className="fa-solid fa-xmark text-[10px]"></i>
                        </button>
                      </div>
                    ))}

                    {/* Add more placeholder */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <i className="fa-solid fa-plus text-lg mb-1"></i>
                      <span className="text-[10px] font-medium">Thêm</span>
                    </button>
                  </div>
                ) : (
                  /* Empty state */
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <i className="fa-solid fa-cloud-arrow-up text-3xl mb-2"></i>
                    <span className="text-sm font-medium">Click để chọn ảnh</span>
                    <span className="text-xs mt-1">JPG, PNG • Tối đa 5MB mỗi ảnh • Chọn nhiều ảnh cùng lúc</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
                <input required className="input" value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
                <select required className="input" value={form.categoryId}
                  onChange={e => setForm({...form, categoryId: e.target.value})}>
                  <option value="">-- Chọn danh mục --</option>
                  {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá gốc (đ) *</label>
                  <input required type="number" min="0" className="input" value={form.price}
                    onChange={e => setForm({...form, price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá sale (đ)</label>
                  <input type="number" min="0" className="input" value={form.salePrice}
                    placeholder="Để trống nếu không giảm"
                    onChange={e => setForm({...form, salePrice: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho *</label>
                  <input required type="number" min="0" className="input" value={form.stockQty}
                    onChange={e => setForm({...form, stockQty: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input className="input" value={form.sku}
                    onChange={e => setForm({...form, sku: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea rows={3} className="input resize-none" value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})} />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={form.active}
                    onChange={e => setForm({...form, active: e.target.checked})} />
                  <div className={`w-10 h-6 rounded-full transition-colors ${form.active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-5' : 'translate-x-1'}`}></div>
                </div>
                <span className="text-sm font-medium text-gray-700">Hiển thị sản phẩm</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                  <i className="fa-solid fa-xmark mr-1"></i>Huỷ
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading
                    ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i>Đang lưu...</>
                    : editing
                      ? <><i className="fa-solid fa-floppy-disk mr-1"></i>Cập nhật</>
                      : <><i className="fa-solid fa-plus mr-1"></i>Thêm mới</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}