import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { productAPI, categoryAPI } from '../services/api'
import ProductCard from '../components/product/ProductCard'

// Icon mapping cho từng danh mục
const CATEGORY_ICONS = {
  'dien-thoai': 'fa-mobile-screen',
  'laptop': 'fa-laptop',
  'tai-nghe': 'fa-headphones',
  'phu-kien': 'fa-plug',
  'may-tinh': 'fa-desktop',
  'dong-ho': 'fa-clock',
  'camera': 'fa-camera',
  'tivi': 'fa-tv',
}

function getCategoryIcon(slug) {
  return CATEGORY_ICONS[slug] || 'fa-box'
}

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

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Mua sắm không giới hạn</h1>
          <p className="text-red-100 text-lg mb-8 max-w-xl">
            Hàng nghìn sản phẩm chính hãng, giao hàng nhanh, thanh toán an toàn qua VNPay.
          </p>
          <Link to="/products"
            className="bg-white text-red-500 font-bold px-8 py-3 rounded-full hover:bg-red-50 transition-colors">
            <i className="fa-solid fa-bag-shopping mr-2"></i>Mua ngay
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Categories */}
        {categories?.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Danh mục sản phẩm</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {categories.map(cat => (
                <Link key={cat.id} to={`/products?categoryId=${cat.id}`}
                  className="card p-5 text-center hover:border-red-200 hover:shadow-md transition-all group cursor-pointer">
                  <div className="w-14 h-14 bg-red-50 rounded-2xl mx-auto mb-3 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                    <i className={`fa-solid ${getCategoryIcon(cat.slug)} text-red-500 text-2xl`}></i>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured products */}
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