import { useState, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { categoryAPI } from '../../../services/api'
import toast from 'react-hot-toast'

const DEFAULT_EMOJI = '📦'

export default function CategorySelector({ categories = [], value, onChange }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Mode: null | 'create' | 'edit'
  const [mode, setMode] = useState(null)
  const [editTarget, setEditTarget] = useState(null) // category đang sửa

  const [formName, setFormName] = useState('')
  const [formImage, setFormImage] = useState(null)      // File mới
  const [formPreview, setFormPreview] = useState(null)  // URL preview
  const [removeImage, setRemoveImage] = useState(false)
  const [saving, setSaving] = useState(false)

  const ref = useRef(null)
  const inputRef = useRef(null)
  const nameRef = useRef(null)
  const fileRef = useRef(null)

  const selected = categories.find(c => String(c.id) === String(value))
  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  // Đóng khi click ra ngoài
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        resetForm()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus() }, [open])
  useEffect(() => { if (mode && nameRef.current) nameRef.current.focus() }, [mode])

  const resetForm = () => {
    setMode(null)
    setEditTarget(null)
    setFormName('')
    setFormImage(null)
    setFormPreview(null)
    setRemoveImage(false)
    setSearch('')
  }

  const openCreate = () => {
    setMode('create')
    setFormName('')
    setFormImage(null)
    setFormPreview(null)
    setRemoveImage(false)
  }

  const openEdit = (e, cat) => {
    e.stopPropagation()
    setMode('edit')
    setEditTarget(cat)
    setFormName(cat.name)
    setFormImage(null)
    setFormPreview(cat.imageUrl || null)
    setRemoveImage(false)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFormImage(file)
    setFormPreview(URL.createObjectURL(file))
    setRemoveImage(false)
  }

  const handleRemoveImage = () => {
    setFormImage(null)
    setFormPreview(null)
    setRemoveImage(true)
    if (fileRef.current) fileRef.current.value = ''
  }

  const buildFormData = () => {
    const fd = new FormData()
    fd.append('name', formName.trim())
    if (formImage) fd.append('image', formImage)
    if (removeImage) fd.append('removeImage', 'true')
    return fd
  }

  const handleSave = async () => {
    if (!formName.trim()) return
    setSaving(true)
    try {
      if (mode === 'create') {
        const res = await categoryAPI.create(buildFormData())
        const created = res.data?.id ? res.data : res.data?.data
        await queryClient.invalidateQueries(['categories'])
        if (created?.id) onChange(String(created.id))
        toast.success(`Đã tạo danh mục "${formName.trim()}"`)
      } else {
        await categoryAPI.update(editTarget.id, buildFormData())
        await queryClient.invalidateQueries(['categories'])
        toast.success('Đã cập nhật danh mục')
      }
      resetForm()
      setOpen(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  const handleSelect = (cat) => {
    onChange(String(cat.id))
    setOpen(false)
    resetForm()
  }

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); if (open) resetForm() }}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-colors bg-white
          ${open ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200 hover:border-gray-300'}
          ${!selected ? 'text-gray-400' : 'text-gray-800'}`}
      >
        <span className="flex items-center gap-2 truncate">
          {selected?.imageUrl
            ? <img src={selected.imageUrl} className="w-5 h-5 rounded object-cover flex-shrink-0" />
            : <span className="text-base leading-none flex-shrink-0">{DEFAULT_EMOJI}</span>
          }
          {selected ? selected.name : 'Chọn danh mục...'}
        </span>
        <i className={`fa-solid fa-chevron-down text-gray-400 text-xs flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}></i>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">

          {/* Search — ẩn khi đang ở mode form */}
          {!mode && (
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <i className="fa-solid fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                <input ref={inputRef} type="text" value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm danh mục..."
                  className="w-full pl-7 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100"
                />
              </div>
            </div>
          )}

          {/* List danh mục */}
          {!mode && (
            <ul className="max-h-48 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-400 text-center">Không tìm thấy</li>
              )}
              {filtered.map(cat => (
                <li key={cat.id}>
                  <button type="button" onClick={() => handleSelect(cat)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-red-50 hover:text-red-600 transition-colors
                      ${String(cat.id) === String(value) ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-700'}`}
                  >
                    {/* Ảnh hoặc emoji */}
                    <span className="flex-shrink-0 w-7 h-7 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                      {cat.imageUrl
                        ? <img src={cat.imageUrl} className="w-full h-full object-cover" />
                        : <span className="text-base">{DEFAULT_EMOJI}</span>
                      }
                    </span>

                    <span className="flex-1 truncate">{cat.name}</span>

                    {/* Nút sửa */}
                    <span
                      role="button"
                      onClick={(e) => openEdit(e, cat)}
                      className="opacity-0 group-hover:opacity-100 ml-auto p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all"
                    >
                      <i className="fa-solid fa-pen text-xs"></i>
                    </span>

                    <i className={`fa-solid fa-check text-xs flex-shrink-0 ${String(cat.id) === String(value) ? 'opacity-100' : 'opacity-0'}`}></i>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Form tạo / sửa */}
          {mode && (
            <div className="p-3 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-600">
                  {mode === 'create' ? 'Tạo danh mục mới' : `Sửa "${editTarget?.name}"`}
                </p>
                <button type="button" onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 p-0.5">
                  <i className="fa-solid fa-xmark text-xs"></i>
                </button>
              </div>

              {/* Upload ảnh */}
              <div className="flex items-center gap-3">
                {/* Preview box */}
                <div className="relative w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {formPreview
                    ? <img src={formPreview} className="w-full h-full object-cover" />
                    : <span className="text-2xl">{DEFAULT_EMOJI}</span>
                  }
                  {/* Nút xóa ảnh */}
                  {formPreview && (
                    <button type="button" onClick={handleRemoveImage}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                      <i className="fa-solid fa-xmark text-[10px]"></i>
                    </button>
                  )}
                </div>

                {/* Upload button */}
                <div className="flex-1">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={handleFileChange} id="cat-img-upload" />
                  <label htmlFor="cat-img-upload"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    <i className="fa-solid fa-image text-xs"></i>
                    {formPreview ? 'Đổi ảnh' : 'Chọn ảnh'}
                  </label>
                  <p className="text-[11px] text-gray-400 mt-1">JPG, PNG — tối đa 2MB</p>
                </div>
              </div>

              {/* Tên */}
              <input ref={nameRef} type="text" value={formName}
                onChange={e => setFormName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); handleSave() }
                  if (e.key === 'Escape') resetForm()
                }}
                placeholder="Tên danh mục..."
                className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100"
              />

              {/* Actions */}
              <div className="flex gap-1.5">
                <button type="button" onClick={handleSave}
                  disabled={saving || !formName.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
                  {saving
                    ? <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                    : <i className="fa-solid fa-check text-xs"></i>
                  }
                  {mode === 'create' ? 'Tạo' : 'Lưu'}
                </button>
                <button type="button" onClick={resetForm}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* Footer: nút tạo mới — chỉ hiện khi đang ở list */}
          {!mode && (
            <div className="border-t border-gray-100">
              <button type="button" onClick={openCreate}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium">
                <i className="fa-solid fa-plus w-4 text-center"></i>
                Tạo danh mục mới
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}