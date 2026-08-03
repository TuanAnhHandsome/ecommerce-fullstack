import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useRef, useState, useCallback } from 'react'
import { productAPI, categoryAPI } from '../services/api'
import ProductCard from '../components/product/ProductCard'

const DEFAULT_EMOJI = '📦'

export default function HomePage() {
  const { data: products } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productAPI.getAll({ page: 0, size: 8, sortBy: 'createdAt', sortDir: 'desc' })
      .then(r => r.data),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getAll().then(r => r.data),
  })

  // ── Scroll + drag + fade logic ──────────
  const trackRef = useRef(null)
  const [showFade, setShowFade] = useState(true)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeftRef = useRef(0)

  const handleScroll = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setShowFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  const handleMouseDown = (e) => {
    isDragging.current = true
    startX.current = e.pageX - trackRef.current.offsetLeft
    scrollLeftRef.current = trackRef.current.scrollLeft
    trackRef.current.style.cursor = 'grabbing'
  }

  const handleMouseMove = (e) => {
    if (!isDragging.current) return
    e.preventDefault()
    const x = e.pageX - trackRef.current.offsetLeft
    trackRef.current.scrollLeft = scrollLeftRef.current - (x - startX.current) * 1.2
  }

  const handleMouseUp = () => {
    isDragging.current = false
    if (trackRef.current) trackRef.current.style.cursor = 'grab'
  }

  return (
    <div>
      {/* ── Hero  */}
      <div className="relative bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center min-h-[500px] lg:min-h-[600px] gap-12">

            {/* Nội dung */}
            <div className="w-full lg:w-1/2 py-12 lg:py-20 z-10">
              <div className="max-w-xl">
                <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-wider text-red-600 uppercase bg-red-100 rounded-full">
                  New Season Arrival
                </span>
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl leading-tight">
                  Nâng tầm trải nghiệm <br />
                  <span className="text-red-500">Công nghệ 2026</span>
                </h1>
                <p className="mt-6 text-lg text-gray-500 sm:text-xl leading-relaxed">
                  Khám phá bộ sưu tập thiết kế mới nhất với hiệu năng vượt trội.
                  Ưu đãi lên đến 30% cho khách hàng mới.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <Link to="/products"
                    className="btn-primary px-10 py-4 text-base font-bold shadow-xl shadow-red-200 text-center rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all">
                    Mua sắm ngay
                  </Link>
                  <Link to="/promotions"
                    className="bg-white border-2 border-gray-100 text-gray-700 font-bold px-10 py-4 rounded-xl hover:border-red-200 hover:text-red-500 transition-all text-base text-center">
                    Xem ưu đãi
                  </Link>
                </div>
              </div>
            </div>

            {/* Ảnh */}
            <div className="w-full lg:w-1/2 relative flex justify-center items-center pb-12 lg:pb-0">
              <div className="absolute w-72 h-72 sm:w-96 sm:h-96 bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
              <div className="relative w-full h-full flex justify-center">
                <img
                  className="w-full max-w-[500px] lg:max-w-full h-auto object-contain drop-shadow-2xl transform hover:scale-105 transition-transform duration-500"
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1000"
                  alt="Featured Product"
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Main content ─ */}
      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* ── Danh mục sản phẩm ── */}
        {categories?.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Danh mục sản phẩm</h2>
              <Link to="/products" className="text-sm text-red-500 hover:text-red-600 font-medium">
                Xem tất cả <i className="fa-solid fa-arrow-right ml-1"></i>
              </Link>
            </div>

            {/* Scroll track với fade */}
            <div className="relative overflow-hidden">
              <div
                ref={trackRef}
                className="flex gap-3 overflow-x-auto py-1"
                style={{ scrollbarWidth: 'none', cursor: 'grab', scrollSnapType: 'x mandatory' }}
                onScroll={handleScroll}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {categories.map(cat => (
                  <Link
                    key={cat.id}
                    to={`/products?categoryId=${cat.id}`}
                    draggable={false}
                    style={{ scrollSnapAlign: 'start', minWidth: '140px', flex: '0 0 calc(25% - 9px)' }}
                    className="card p-4 text-center hover:border-red-200 hover:shadow-md transition-all group cursor-pointer select-none"
                  >
                    {/* Ảnh hoặc emoji fallback */}
                    <div className="w-14 h-14 rounded-2xl mx-auto mb-3 overflow-hidden bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                      {cat.imageUrl
                        ? <img
                          src={cat.imageUrl}
                          alt={cat.name}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                        : <span className="text-2xl">{DEFAULT_EMOJI}</span>
                      }
                    </div>
                    <span className="text-sm font-semibold text-gray-700 line-clamp-2">
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Fade overlay bên phải */}
              <div
                className="pointer-events-none absolute top-0 right-0 bottom-0 w-24 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(to right, transparent, #f9fafb)',
                  opacity: showFade ? 1 : 0,
                }}
              />
            </div>
          </section>
        )}

        {/* ── Sản phẩm mới nhất ── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              <i className="fa-solid fa-fire text-red-500 mr-2"></i>Sản phẩm mới nhất
            </h2>
            <Link to="/products" className="text-sm text-red-500 hover:text-red-600 font-medium">
              Xem tất cả <i className="fa-solid fa-arrow-right ml-1"></i>
            </Link>
          </div>

          {products?.content?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.content.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <i className="fa-solid fa-box-open text-4xl mb-3 block"></i>
              Đang tải sản phẩm...
            </div>
          )}
        </section>

      </div>
    </div>
  )
}