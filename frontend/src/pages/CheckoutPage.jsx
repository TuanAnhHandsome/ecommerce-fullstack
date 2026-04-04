import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { orderAPI, paymentAPI } from '../services/api'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, totalAmount, fetchCart, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    shippingName: user?.fullName || '',
    shippingPhone: user?.phone || '',
    shippingAddress: user?.address || '',
    note: '',
    paymentGateway: 'VNPAY',
  })

  useEffect(() => { fetchCart() }, [])

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p) + 'đ'
  const shippingFee = totalAmount >= 500000 ? 0 : 30000
  const finalAmount = totalAmount + shippingFee

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (items.length === 0) { toast.error('Giỏ hàng trống!'); return }
    setLoading(true)
    try {
      const { data: order } = await orderAPI.create(form)

      if (form.paymentGateway === 'COD') {
        clearCart()
        toast.success('Đặt hàng thành công!')
        navigate(`/orders/${order.id}`)
        return
      }

      const { data: payment } = await paymentAPI.createVNPay(order.id)
      window.location.href = payment.paymentUrl

    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt hàng thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <i className="fa-solid fa-credit-card text-red-500"></i>Thanh toán
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
          {/* Shipping info */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-location-dot text-red-500"></i>Thông tin giao hàng
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <i className="fa-solid fa-user mr-1 text-gray-400"></i>Họ tên *
                  </label>
                  <input required className="input" value={form.shippingName}
                    onChange={e => setForm({...form, shippingName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <i className="fa-solid fa-phone mr-1 text-gray-400"></i>Điện thoại *
                  </label>
                  <input required className="input" value={form.shippingPhone}
                    onChange={e => setForm({...form, shippingPhone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <i className="fa-solid fa-map-pin mr-1 text-gray-400"></i>Địa chỉ giao hàng *
                </label>
                <textarea required rows={2} className="input resize-none" value={form.shippingAddress}
                  onChange={e => setForm({...form, shippingAddress: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <i className="fa-solid fa-note-sticky mr-1 text-gray-400"></i>Ghi chú
                </label>
                <textarea rows={2} className="input resize-none"
                  placeholder="Ghi chú cho người giao hàng..."
                  value={form.note}
                  onChange={e => setForm({...form, note: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-wallet text-red-500"></i>Phương thức thanh toán
            </h2>
            <div className="space-y-3">
              {[
                { value: 'VNPAY', label: 'VNPay', desc: 'Thanh toán qua cổng VNPay (ATM, QR, Ví)', icon: 'fa-qrcode', badge: 'SANDBOX', badgeColor: 'bg-green-100 text-green-700' },
                { value: 'COD',   label: 'Thanh toán khi nhận hàng', desc: 'Trả tiền mặt khi nhận hàng (COD)', icon: 'fa-money-bill-wave', badge: null },
              ].map(opt => (
                <label key={opt.value}
                  className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    form.paymentGateway === opt.value
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}>
                  <input type="radio" name="payment" value={opt.value}
                    checked={form.paymentGateway === opt.value}
                    onChange={() => setForm({...form, paymentGateway: opt.value})} />
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    form.paymentGateway === opt.value ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    <i className={`fa-solid ${opt.icon} ${form.paymentGateway === opt.value ? 'text-red-500' : 'text-gray-400'}`}></i>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 flex items-center gap-2">
                      {opt.label}
                      {opt.badge && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${opt.badgeColor}`}>
                          {opt.badge}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading || items.length === 0}
            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2">
            {loading
              ? <><i className="fa-solid fa-spinner fa-spin"></i>Đang xử lý...</>
              : form.paymentGateway === 'VNPAY'
                ? <><i className="fa-solid fa-lock"></i>Thanh toán qua VNPay</>
                : <><i className="fa-solid fa-check"></i>Đặt hàng (COD)</>
            }
          </button>
        </form>

        {/* Order summary */}
        <div className="card p-6 h-fit sticky top-20">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-receipt text-gray-400"></i>
            Đơn hàng ({items.length})
          </h2>

          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
            {items.map(item => (
              <div key={item.productId} className="flex gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.productImage
                    ? <img src={item.productImage} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <i className="fa-solid fa-image text-gray-300"></i>
                      </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 line-clamp-1">{item.productName}</p>
                  <p className="text-xs text-gray-400">×{item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-gray-700 flex-shrink-0">
                  {new Intl.NumberFormat('vi-VN').format(item.subtotal)}đ
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tạm tính</span><span>{new Intl.NumberFormat('vi-VN').format(totalAmount)}đ</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <i className="fa-solid fa-truck text-blue-400 text-xs"></i>Phí ship
              </span>
              <span className={shippingFee === 0 ? 'text-green-600 font-medium' : ''}>
                {shippingFee === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN').format(shippingFee) + 'đ'}
              </span>
            </div>
            <div className="flex justify-between font-bold text-gray-800 text-lg pt-2 border-t border-gray-100">
              <span>Tổng cộng</span>
              <span className="text-red-500">{new Intl.NumberFormat('vi-VN').format(finalAmount)}đ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}