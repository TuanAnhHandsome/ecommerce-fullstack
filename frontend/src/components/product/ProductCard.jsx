import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'

export default function ProductCard({ product }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const addItem = useCartStore(s => s.addItem)

  const handleAddToCart = (e) => {
    e.preventDefault()
    if (!isAuthenticated) { window.location.href = '/login'; return }
    addItem(product.id, 1)
  }

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + 'đ'
  const isOnSale = product.salePrice && product.salePrice < product.price
  const discount = isOnSale ? Math.round((1 - product.salePrice / product.price) * 100) : 0

  return (
    <Link to={`/products/${product.slug}`} className="card group hover:shadow-md transition-shadow block">
      {/* Image */}
      <div className="relative overflow-hidden rounded-t-xl aspect-square bg-gray-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
          />
        ) : null}
        {/* Fallback khi không có ảnh */}
        <div
          className="w-full h-full flex-col items-center justify-center text-gray-300 bg-gray-50"
          style={{ display: product.imageUrl ? 'none' : 'flex' }}
        >
          <i className="fa-solid fa-image text-5xl mb-2"></i>
          <span className="text-xs text-gray-400">Chưa có ảnh</span>
        </div>

        {isOnSale && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
        {product.stockQty === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
              <i className="fa-solid fa-ban mr-1"></i>Hết hàng
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs text-gray-400 mb-1">
          <i className="fa-solid fa-tag mr-1"></i>{product.categoryName}
        </p>
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2 group-hover:text-red-500 transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-red-500 font-bold">{formatPrice(product.effectivePrice)}</span>
          {isOnSale && (
            <span className="text-gray-400 text-xs line-through">{formatPrice(product.price)}</span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stockQty === 0}
          className="w-full btn-primary text-sm py-2"
        >
          {product.stockQty === 0
            ? <><i className="fa-solid fa-ban mr-1"></i>Hết hàng</>
            : <><i className="fa-solid fa-cart-plus mr-1"></i>Thêm vào giỏ</>
          }
        </button>
      </div>
    </Link>
  )
}