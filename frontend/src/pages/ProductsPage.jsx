import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { productAPI, categoryAPI } from '../services/api'
import ProductCard from '../components/product/ProductCard'

// ─── Constants ───────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'createdAt,desc', label: 'Mới nhất' },
  { value: 'price,asc',      label: 'Giá: Thấp → Cao' },
  { value: 'price,desc',     label: 'Giá: Cao → Thấp' },
  { value: 'name,asc',       label: 'Tên A → Z' },
]

const PRICE_PRESETS = [
  { label: 'Dưới 1 triệu',    min: 0,         max: 1_000_000 },
  { label: '1 – 5 triệu',     min: 1_000_000, max: 5_000_000 },
  { label: '5 – 15 triệu',    min: 5_000_000, max: 15_000_000 },
  { label: '15 – 30 triệu',   min: 15_000_000, max: 30_000_000 },
  { label: 'Trên 30 triệu',   min: 30_000_000, max: '' },
]

const PAGE_SIZE = 12

const fmt = (n) =>
  n === '' || n == null
    ? ''
    : new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n)

// ─── Sub-components ───────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="aspect-square bg-gray-200 rounded-t-xl" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-5 bg-gray-200 rounded w-1/2 mt-2" />
        <div className="h-8 bg-gray-200 rounded-lg mt-3" />
      </div>
    </div>
  )
}

// Pagination thông minh — tối đa hiển thị 7 nút
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const buildPages = () => {
    if (totalPages <= 7) return [...Array(totalPages)].map((_, i) => i)
    const pages = []
    pages.push(0)
    if (page > 3) pages.push('...')
    const start = Math.max(1, page - 1)
    const end   = Math.min(totalPages - 2, page + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (page < totalPages - 4) pages.push('...')
    pages.push(totalPages - 1)
    return pages
  }

  return (
    <div className="flex justify-center items-center gap-1.5 mt-8 flex-wrap">
      {/* Prev */}
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center
                   disabled:opacity-30 hover:border-red-300 hover:text-red-500 transition-colors"
      >
        <i className="fa-solid fa-chevron-left text-xs" />
      </button>

      {buildPages().map((p, i) =>
        p === '...' ? (
          <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
              page === p
                ? 'bg-red-500 text-white shadow-sm'
                : 'border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500'
            }`}
          >
            {p + 1}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages - 1}
        className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center
                   disabled:opacity-30 hover:border-red-300 hover:text-red-500 transition-colors"
      >
        <i className="fa-solid fa-chevron-right text-xs" />
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────
export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Đọc state từ URL
  const page       = parseInt(searchParams.get('page') || '0')
  const keyword    = searchParams.get('search') || searchParams.get('keyword') || ''
  const categoryId = searchParams.get('categoryId') || ''
  const sort       = searchParams.get('sort') || 'createdAt,desc'
  const minPrice   = searchParams.get('minPrice') || ''
  const maxPrice   = searchParams.get('maxPrice') || ''

  // Local state cho price input
  // Thêm 2 state theo dõi focus
const [minFocused, setMinFocused] = useState(false)
const [maxFocused, setMaxFocused] = useState(false)
  const [minInput, setMinInput] = useState(minPrice)
  const [maxInput, setMaxInput] = useState(maxPrice)
  const [priceError, setPriceError] = useState('')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Sync local input khi URL thay đổi (vd: bấm xóa filter)
  useEffect(() => { setMinInput(minPrice) }, [minPrice])
  useEffect(() => { setMaxInput(maxPrice) }, [maxPrice])

  // Parse sort → sortBy + sortDir
  const [sortBy, sortDir] = sort.split(',')

  // ── Queries ──────────────────────────────────────────────────
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', page, keyword, categoryId, sortBy, sortDir, minPrice, maxPrice],
    queryFn: () =>
      productAPI.getAll({
        page,
        size: PAGE_SIZE,
        keyword:    keyword    || undefined,
        categoryId: categoryId || undefined,
        sortBy,
        sortDir,
        minPrice:   minPrice   || undefined,
        maxPrice:   maxPrice   || undefined,
      }).then(r => r.data),
    keepPreviousData: true,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getAll().then(r => r.data),
  })

  // ── Helpers ──────────────────────────────────────────────────
  const setParam = useCallback((updates) => {
    const current = Object.fromEntries(searchParams)
    const next = { ...current, ...updates }
    // Xóa key có giá trị rỗng
    Object.keys(next).forEach(k => {
      if (next[k] === '' || next[k] == null) delete next[k]
    })
    // Reset page khi thay đổi filter
    if (!('page' in updates)) delete next.page
    setSearchParams(next)
  }, [searchParams, setSearchParams])

  const clearParam = useCallback((...keys) => {
    const current = Object.fromEntries(searchParams)
    keys.forEach(k => delete current[k])
    delete current.page
    setSearchParams(current)
  }, [searchParams, setSearchParams])

  // ── Price filter ─────────────────────────────────────────────
  const applyPrice = () => {
    const min = minInput.replace(/\D/g, '')
    const max = maxInput.replace(/\D/g, '')
    if (min && max && Number(min) > Number(max)) {
      setPriceError('Giá tối thiểu phải nhỏ hơn tối đa')
      return
    }
    setPriceError('')
    setParam({ minPrice: min, maxPrice: max })
  }

  const applyPreset = (preset) => {
    setPriceError('')
    setMinInput(preset.min ? String(preset.min) : '')
    setMaxInput(preset.max ? String(preset.max) : '')
    setParam({ minPrice: preset.min || '', maxPrice: preset.max || '' })
  }

  const isPresetActive = (preset) =>
    String(minPrice) === String(preset.min || '') &&
    String(maxPrice) === String(preset.max || '')

  // ── Active filters (để hiển thị tags) ───────────────────────
  const activeFilters = []
  if (keyword)    activeFilters.push({ label: `"${keyword}"`,        clear: () => clearParam('search', 'keyword') })
  if (categoryId) {
    const cat = categories?.find(c => String(c.id) === String(categoryId))
    activeFilters.push({ label: cat?.name || `Danh mục #${categoryId}`, clear: () => clearParam('categoryId') })
  }
  if (minPrice || maxPrice) {
    const label = minPrice && maxPrice
      ? `${fmt(minPrice)}₫ – ${fmt(maxPrice)}₫`
      : minPrice ? `Từ ${fmt(minPrice)}₫`
      : `Đến ${fmt(maxPrice)}₫`
    activeFilters.push({ label, clear: () => clearParam('minPrice', 'maxPrice') })
  }

  // ── Sidebar content (dùng lại cho cả desktop + mobile) ───────
  const SidebarContent = () => (
    <div className="space-y-5">
      {/* Categories */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Danh mục</p>
        <button
          onClick={() => { clearParam('categoryId'); setMobileSidebarOpen(false) }}
          className={`block w-full text-left text-sm py-2 px-3 rounded-lg transition-colors mb-1 ${
            !categoryId ? 'bg-red-50 text-red-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <i className="fa-solid fa-th-large mr-2" />Tất cả
        </button>
        {categories?.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setParam({ categoryId: cat.id }); setMobileSidebarOpen(false) }}
            className={`block w-full text-left text-sm py-2 px-3 rounded-lg transition-colors mb-1 ${
              String(categoryId) === String(cat.id)
                ? 'bg-red-50 text-red-600 font-semibold'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <i className="fa-solid fa-chevron-right mr-2 text-xs" />{cat.name}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Price filter */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Khoảng giá</p>

        {/* Presets */}
        <div className="space-y-1 mb-3">
          {PRICE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => { applyPreset(preset); setMobileSidebarOpen(false) }}
              className={`block w-full text-left text-sm py-2 px-3 rounded-lg transition-colors ${
                isPresetActive(preset)
                  ? 'bg-red-50 text-red-600 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom range */}
        <p className="text-xs text-gray-400 mb-1.5">Hoặc nhập khoảng giá</p>
        <div className="flex gap-1.5 items-center">
          <input
            type="text"
            placeholder="Từ"
            value={minInput ? fmt(minInput) : ''}
            onChange={e => setMinInput(e.target.value.replace(/\D/g, ''))}
            className="input text-sm py-1.5 px-2 w-0 flex-1"
          />
          <span className="text-gray-300 text-xs flex-shrink-0">—</span>
          <input
            type="text"
            placeholder="Đến"
            value={maxInput ? fmt(maxInput) : ''}
            onChange={e => setMaxInput(e.target.value.replace(/\D/g, ''))}
            className="input text-sm py-1.5 px-2 w-0 flex-1"
          />
        </div>
        {priceError && (
          <p className="text-xs text-red-500 mt-1">{priceError}</p>
        )}
        <button
          onClick={() => { applyPrice(); setMobileSidebarOpen(false) }}
          className="btn-primary w-full text-sm py-1.5 mt-2"
        >
          Áp dụng
        </button>
        {(minPrice || maxPrice) && (
          <button
            onClick={() => { clearParam('minPrice', 'maxPrice'); setMobileSidebarOpen(false) }}
            className="w-full text-xs text-gray-400 hover:text-red-400 mt-1.5 transition-colors"
          >
            Xóa lọc giá
          </button>
        )}
      </div>

      {/* Clear all */}
      {activeFilters.length > 0 && (
        <>
          <div className="border-t border-gray-100" />
          <button
            onClick={() => {
              setSearchParams({})
              setMobileSidebarOpen(false)
            }}
            className="w-full text-sm text-red-500 hover:text-red-600 font-medium py-1 transition-colors"
          >
            <i className="fa-solid fa-rotate-left mr-1.5" />Xóa tất cả bộ lọc
          </button>
        </>
      )}
    </div>
  )

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="card p-4 sticky top-20">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-filter text-red-500" />Lọc sản phẩm
            </h3>
            <SidebarContent />
          </div>
        </aside>

        {/* ── Mobile Sidebar Drawer ── */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl overflow-y-auto p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <i className="fa-solid fa-filter text-red-500" />Lọc sản phẩm
                </h3>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fa-solid fa-xmark text-lg" />
                </button>
              </div>
              <SidebarContent />
            </div>
          </div>
        )}

        {/* ── Main Content ── */}
        <div className="flex-1 min-w-0">

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* Mobile filter button */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg
                         text-sm text-gray-600 hover:border-red-300 hover:text-red-500 transition-colors self-start"
            >
              <i className="fa-solid fa-sliders" />
              Bộ lọc
              {activeFilters.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </button>

            <div className="flex gap-2 flex-1">
              {/* Search input */}
              <form
                onSubmit={e => { e.preventDefault(); setParam({ search: e.target.search.value }) }}
                className="flex gap-2 flex-1"
              >
                <div className="relative flex-1">
                  <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    name="search"
                    defaultValue={keyword}
                    key={keyword}
                    className="input pl-9"
                    placeholder="Tìm kiếm sản phẩm..."
                  />
                </div>
                <button type="submit" className="btn-primary px-4">Tìm</button>
              </form>

              {/* Sort */}
              <select
                value={sort}
                onChange={e => setParam({ sort: e.target.value })}
                className="input w-full sm:w-44 flex-shrink-0"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filters bar */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeFilters.map((f, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 text-sm
                             px-3 py-1 rounded-full border border-red-100"
                >
                  {f.label}
                  <button
                    onClick={f.clear}
                    className="hover:text-red-800 transition-colors"
                  >
                    <i className="fa-solid fa-xmark text-xs" />
                  </button>
                </span>
              ))}
              <button
                onClick={() => setSearchParams({})}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors px-1"
              >
                Xóa tất cả
              </button>
            </div>
          )}

          {/* Result info */}
          {!isLoading && data && (
            <p className="text-sm text-gray-500 mb-4">
              <i className="fa-solid fa-box mr-1" />
              Tìm thấy{' '}
              <span className="font-semibold text-gray-700">{data.totalElements ?? 0}</span>{' '}
              sản phẩm
              {isFetching && !isLoading && (
                <span className="ml-2 text-gray-400">
                  <i className="fa-solid fa-spinner fa-spin text-xs" />
                </span>
              )}
            </p>
          )}

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(PAGE_SIZE)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : data?.content?.length > 0 ? (
            <>
              <div
                className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-opacity duration-200 ${
                  isFetching ? 'opacity-60' : 'opacity-100'
                }`}
              >
                {data.content.map(p => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination */}
              <Pagination
                page={page}
                totalPages={data.totalPages}
                onChange={p => setParam({ page: p })}
              />

              {/* Page info */}
              {data.totalPages > 1 && (
                <p className="text-center text-xs text-gray-400 mt-3">
                  Trang {page + 1} / {data.totalPages}
                  {' · '}{data.totalElements} sản phẩm
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <i className="fa-solid fa-box-open text-5xl mb-4 block" />
              <p className="text-lg font-medium text-gray-500">Không tìm thấy sản phẩm nào</p>
              {activeFilters.length > 0 && (
                <button
                  onClick={() => setSearchParams({})}
                  className="mt-3 text-sm text-red-500 hover:underline"
                >
                  Xóa bộ lọc và thử lại
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}