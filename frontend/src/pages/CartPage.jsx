import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'

export default function CartPage() {
  const navigate = useNavigate()
  const { items, totalAmount, totalItems, fetchCart, updateItem, removeItem } = useCartStore()

  useEffect(() => { fetchCart() }, [])

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p) + 'đ'
  const shippingFee = totalAmount >= 500000 ? 0 : 30000
  const finalAmount = totalAmount + shippingFee

  if (items.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <i className="fa-solid fa-cart-shopping text-4xl text-gray-300"></i>
      </div>
      <h2 className="text-xl font-bold text-gray-700 mb-2">Giỏ hàng trống</h2>
      <p className="text-gray-400 mb-6">Hãy thêm sản phẩm vào giỏ hàng của bạn!</p>
      <Link to="/products" className="btn-primary px-8 py-3 inline-flex items-center gap-2">
        <i className="fa-solid fa-bag-shopping"></i>Mua sắm ngay
      </Link>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <i className="fa-solid fa-cart-shopping text-red-500"></i>
        Giỏ hàng
        <span className="text-base font-normal text-gray-400">({totalItems} sản phẩm)</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => (
            <div key={item.productId} className="card p-4 flex gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                {item.productImage
                  ? <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <i className="fa-solid fa-image text-2xl text-gray-300"></i>
                    </div>
                }
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1">{item.productName}</h3>
                <p className="text-red-500 font-bold">{formatPrice(item.unitPrice)}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <button onClick={() => removeItem(item.productId)}
                  className="text-gray-300 hover:text-red-400 transition-colors p-1">
                  <i className="fa-solid fa-xmark"></i>
                </button>

                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => updateItem(item.productId, item.quantity - 1)}
                    className="px-3 py-1.5 hover:bg-gray-50 text-gray-600 transition-colors">
                    <i className="fa-solid fa-minus text-xs"></i>
                  </button>
                  <span className="px-4 py-1.5 text-sm font-bold border-x border-gray-200 min-w-[40px] text-center">
                    {item.quantity}
                  </span>
                  <button onClick={() => updateItem(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.maxStock}
                    className="px-3 py-1.5 hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-30">
                    <i className="fa-solid fa-plus text-xs"></i>
                  </button>
                </div>

                <p className="text-sm font-bold text-gray-700">{formatPrice(item.subtotal)}</p>
              </div>
            </div>
          ))}

          {/* Continue shopping */}
          <Link to="/products" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors mt-2">
            <i className="fa-solid fa-arrow-left"></i>Tiếp tục mua sắm
          </Link>
        </div>

        {/* Summary */}
        <div className="card p-6 h-fit sticky top-20">
          <h2 className="font-bold text-gray-800 mb-4 text-lg">Tóm tắt đơn hàng</h2>

          <div className="space-y-3 mb-4 pb-4 border-b border-gray-100">
            {items.map(item => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-gray-500 line-clamp-1 flex-1 mr-2">{item.productName} ×{item.quantity}</span>
                <span className="text-gray-700 flex-shrink-0">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tạm tính</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <i className="fa-solid fa-truck text-blue-400"></i>Phí vận chuyển
              </span>
              <span className={shippingFee === 0 ? 'text-green-600 font-medium' : ''}>
                {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
              </span>
            </div>
            {shippingFee > 0 && (
              <p className="text-xs text-orange-500 bg-orange-50 rounded-lg px-3 py-2">
                <i className="fa-solid fa-circle-info mr-1"></i>
                Mua thêm {formatPrice(500000 - totalAmount)} để được miễn phí ship
              </p>
            )}
          </div>

          <div className="flex justify-between font-bold text-gray-800 text-lg border-t border-gray-100 pt-4 mb-4">
            <span>Tổng cộng</span>
            <span className="text-red-500">{formatPrice(finalAmount)}</span>
          </div>

          <button onClick={() => navigate('/checkout')} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <i className="fa-solid fa-lock"></i>Tiến hành thanh toán
          </button>
        </div>
      </div>
    </div>
  )
}