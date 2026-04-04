import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { productAPI, categoryAPI } from '../services/api'
import ProductCard from '../components/product/ProductCard'

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Mới nhất' },
  { value: 'price-asc',      label: 'Giá: Thấp → Cao' },
  { value: 'price-desc',     label: 'Giá: Cao → Thấp' },
  { value: 'name-asc',       label: 'Tên A → Z' },
]

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

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState(searchParams.get('keyword') || '')

  const keyword    = searchParams.get('keyword') || ''
  const categoryId = searchParams.get('categoryId') || ''
  const sortParam  = searchParams.get('sort') || 'createdAt-desc'
  const [sortBy, sortDir] = sortParam.split('-')

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, keyword, categoryId, sortBy, sortDir],
    queryFn: () => productAPI.getAll({
      page, size: 12,
      keyword: keyword || undefined,
      categoryId: categoryId || undefined,
      sortBy, sortDir
    }).then(r => r.data),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getAll().then(r => r.data),
  })

  const updateParams = (updates) => {
    const current = Object.fromEntries(searchParams)
    setSearchParams({ ...current, ...updates })
    setPage(0)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    updateParams({ keyword: searchInput })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Sidebar */}
        <aside className="w-full lg:w-56 flex-shrink-0">
          <div className="card p-4 sticky top-20">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-filter text-red-500"></i>Lọc sản phẩm
            </h3>

            {/* Category filter */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Danh mục</p>
              <button onClick={() => updateParams({ categoryId: '' })}
                className={`block w-full text-left text-sm py-2 px-3 rounded-lg transition-colors mb-1 ${
                  !categoryId ? 'bg-red-50 text-red-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                <i className="fa-solid fa-th-large mr-2"></i>Tất cả
              </button>
              {categories?.map(cat => (
                <button key={cat.id}
                  onClick={() => updateParams({ categoryId: cat.id })}
                  className={`block w-full text-left text-sm py-2 px-3 rounded-lg transition-colors mb-1 ${
                    categoryId == cat.id ? 'bg-red-50 text-red-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                  }`}>
                  <i className="fa-solid fa-chevron-right mr-2 text-xs"></i>{cat.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input
                  className="input pl-9"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary px-4">Tìm</button>
            </form>
            <select
              value={sortParam}
              onChange={e => updateParams({ sort: e.target.value })}
              className="input w-full sm:w-44">
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Result info */}
          {!isLoading && data && (
            <p className="text-sm text-gray-500 mb-4">
              <i className="fa-solid fa-box mr-1"></i>
              Tìm thấy <span className="font-semibold text-gray-700">{data.totalElements}</span> sản phẩm
              {keyword && <span> cho "<span className="text-red-500">{keyword}</span>"</span>}
            </p>
          )}

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : data?.content?.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {data.content.map(p => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}
                    className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:border-red-300 hover:text-red-500 transition-colors">
                    <i className="fa-solid fa-chevron-left text-xs"></i>
                  </button>
                  {[...Array(data.totalPages)].map((_, i) => (
                    <button key={i} onClick={() => setPage(i)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        page === i
                          ? 'bg-red-500 text-white'
                          : 'border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500'
                      }`}>
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(data.totalPages-1, p+1))} disabled={page === data.totalPages-1}
                    className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:border-red-300 hover:text-red-500 transition-colors">
                    <i className="fa-solid fa-chevron-right text-xs"></i>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <i className="fa-solid fa-box-open text-5xl mb-4 block"></i>
              <p className="text-lg font-medium">Không tìm thấy sản phẩm nào</p>
              {keyword && <p className="text-sm mt-1">Thử tìm kiếm với từ khóa khác</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}