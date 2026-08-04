import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { productAPI, categoryAPI } from '../../services/api'
import toast from 'react-hot-toast'
import ProductFormModal from '../../components/admin/product/ProductFormModal'
import ProductImportModal from '../../components/admin/product/ProductImportModal'

const formatPrice = (p) => p ? new Intl.NumberFormat('vi-VN').format(p) + 'đ' : '—'

const EMPTY_FORM = {
  name: '', categoryId: '', price: '', salePrice: '',
  stockQty: '', sku: '', description: '', active: true
}

export default function ProductsAdminPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editing, setEditing] = useState(null)
  const [activeTab, setActiveTab] = useState('basic')
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState(EMPTY_FORM)
  const [existingImages, setExistingImages] = useState([])
  const [newImages, setNewImages] = useState([])
  const [deletedImageIds, setDeletedImageIds] = useState([])
  const [specs, setSpecs] = useState([])

  const { data } = useQuery({
    queryKey: ['admin-products', page, keyword],
    queryFn: () => productAPI.getAll({
      page, size: 15,
      keyword: keyword || undefined,
      sortBy: 'createdAt', sortDir: 'desc',
      includeInactive: true,   // ← lấy cả sản phẩm đang ẩn
    }).then(r => r.data),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getAll().then(r => r.data),
  })

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setExistingImages([])
    setNewImages([])
    setDeletedImageIds([])
    setSpecs([])
    setActiveTab('basic')
  }

  const openCreate = () => { setEditing(null); resetForm(); setShowForm(true) }

  const openEdit = (p) => {
    setEditing(p)
    setForm({
      name: p.name, categoryId: p.categoryId || '',
      price: p.price, salePrice: p.salePrice || '',
      stockQty: p.stockQty, sku: p.sku || '',
      description: p.description || '', active: p.active
    })
    const mainUrl = p.images?.[0] ?? p.imageUrl ?? null
    setExistingImages(mainUrl ? [{ url: mainUrl }] : [])
    setNewImages([])
    setDeletedImageIds([])

    const flatSpecs = []
    if (p.specs) {
      Object.entries(p.specs).forEach(([group, rows]) => {
        rows.forEach((r, i) => {
          flatSpecs.push({ group, key: r.key, value: r.value, sortOrder: i })
        })
      })
    }
    setSpecs(flatSpecs)

    setActiveTab('basic')
    setShowForm(true)
  }

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
        specs: specs.length ? specs : [],
      })], { type: 'application/json' }))

      if (newImages[0]) fd.append('images', newImages[0].file)

      if (editing) {
        await productAPI.update(editing.id, fd)
        toast.success('Cập nhật thành công!')
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

  // Toggle ẩn / hiện sản phẩm
  const handleToggleActive = async (id, name, currentActive) => {
    const action = currentActive ? 'ẩn' : 'hiện lại'
    if (!confirm(`Bạn muốn ${action} sản phẩm "${name}"?`)) return
    try {
      await productAPI.toggleActive(id, !currentActive)  // ← gọi đúng method
      toast.success(`Đã ${action} sản phẩm`)
      queryClient.invalidateQueries(['admin-products'])
    } catch {
      toast.error('Không thể cập nhật trạng thái')
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-box text-indigo-500"></i>Quản lý sản phẩm
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{data?.totalElements || 0} sản phẩm</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImport(true)} className="btn-secondary flex items-center gap-2">
            <i className="fa-solid fa-file-excel"></i>Import hàng loạt
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <i className="fa-solid fa-plus"></i>Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="relative">
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
                  <th key={h} className="text-left text-xs font-semibold text-gray-500
                    px-4 py-3 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.content?.map(p => (
                <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${!p.active ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        {p.imageUrl
                          ? <img src={p.imageUrl} className="w-full h-full object-cover"
                            crossOrigin="anonymous" referrerPolicy="no-referrer" />
                          : <div className="w-full h-full flex items-center justify-center">
                            <i className="fa-solid fa-image text-gray-300"></i>
                          </div>
                        }
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 line-clamp-1 max-w-[200px]">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.sku || '—'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {p.variants?.length > 0 && (
                            <span className="text-xs text-indigo-500">
                              <i className="fa-solid fa-layer-group mr-1"></i>{p.variants.length} biến thể
                            </span>
                          )}
                          {p.specs && Object.keys(p.specs).length > 0 && (
                            <span className="text-xs text-emerald-500">
                              <i className="fa-solid fa-microchip mr-1"></i>Có thông số
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.categoryName}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-indigo-600">{formatPrice(p.effectivePrice)}</p>
                    {p.salePrice && <p className="text-xs text-gray-400 line-through">{formatPrice(p.price)}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-semibold ${p.stockQty === 0 ? 'text-rose-500'
                      : p.stockQty < 10 ? 'text-amber-600'
                        : 'text-emerald-600'
                      }`}>
                      {p.stockQty === 0
                        ? <><i className="fa-solid fa-circle-xmark mr-1"></i>Hết</>
                        : <><i className="fa-solid fa-circle-check mr-1"></i>{p.stockQty}</>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                      {p.active
                        ? <><i className="fa-solid fa-eye mr-1"></i>Hiển thị</>
                        : <><i className="fa-solid fa-eye-slash mr-1"></i>Ẩn</>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(p)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa">
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      {/* Toggle ẩn / hiện */}
                      <button
                        onClick={() => handleToggleActive(p.id, p.name, p.active)}
                        className={`p-1.5 rounded-lg transition-colors ${p.active
                          ? 'text-rose-400 hover:bg-rose-50'
                          : 'text-emerald-500 hover:bg-emerald-50'
                          }`}
                        title={p.active ? 'Ẩn sản phẩm' : 'Hiện lại'}
                      >
                        <i className={`fa-solid ${p.active ? 'fa-eye-slash' : 'fa-eye'}`}></i>
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
                className={`w-8 h-8 rounded-lg text-sm font-medium ${page === i ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showImport && <ProductImportModal onClose={() => setShowImport(false)} />}

      {showForm && (
        <ProductFormModal
          editing={editing}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          form={form}
          setForm={setForm}
          categories={categories}
          existingImages={existingImages}
          setExistingImages={setExistingImages}
          newImages={newImages}
          setNewImages={setNewImages}
          deletedImageIds={deletedImageIds}
          setDeletedImageIds={setDeletedImageIds}
          specs={specs}
          setSpecs={setSpecs}
          loading={loading}
          onClose={() => setShowForm(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}