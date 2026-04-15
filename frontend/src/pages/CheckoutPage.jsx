import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom' // Thêm useLocation
import { orderAPI, paymentAPI, couponAPI } from '../services/api'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const fmt = (p) => new Intl.NumberFormat('vi-VN').format(p) + 'đ'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // 1. Lấy danh sách ID sản phẩm được chọn từ state của router
  const selectedIds = location.state?.selectedIds || []

  const { items: allItems, fetchCart, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState({
    shippingName: user?.fullName || '',
    shippingPhone: user?.phone || '',
    shippingAddress: user?.address || '',
    note: '',
    paymentGateway: 'VNPAY',
  })

  // ── Lọc sản phẩm thực tế cần thanh toán ──────────────────────────
  const items = useMemo(() => {
    return allItems.filter(item => selectedIds.includes(item.productId))
  }, [allItems, selectedIds])

  // Nếu không có sản phẩm nào được chọn (hoặc bị F5 mất state), quay lại giỏ hàng
  useEffect(() => {
    if (selectedIds.length === 0) {
      toast.error('Vui lòng chọn sản phẩm cần thanh toán từ giỏ hàng')
      navigate('/cart')
    }
    fetchCart()
  }, [selectedIds, navigate, fetchCart])

  // ── Coupon state ──────────────────────────────────────────────
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')

  // ── Tính toán số tiền dựa trên danh sách đã lọc ──────────────────
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0)
  const shippingFee = (totalAmount >= 500_000 || totalAmount === 0) ? 0 : 30_000
  const discountAmount = coupon?.discountAmount ?? 0
  const finalAmount = totalAmount - discountAmount + shippingFee

  // ── Apply coupon ──────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return
    setCouponLoading(true)
    setCouponError('')
    setCoupon(null)
    try {
      const { data } = await couponAPI.apply(couponInput.trim(), totalAmount)
      setCoupon(data)
      toast.success(`Áp dụng mã thành công! Giảm ${fmt(data.discountAmount)}`)
    } catch (err) {
      const msg = err.response?.data?.message || 'Mã không hợp lệ'
      setCouponError(msg)
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setCoupon(null)
    setCouponInput('')
    setCouponError('')
  }

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (items.length === 0) { 
        toast.error('Không có sản phẩm nào để thanh toán!'); 
        return 
    }
    
    setLoading(true)
    try {
      // Gửi kèm danh sách productId hoặc toàn bộ items đã lọc tùy theo Backend yêu cầu
      const { data: order } = await orderAPI.create({
        ...form,
        items: items, // Gửi danh sách sản phẩm thực tế đã chọn
        couponCode: coupon?.code ?? null,
      })

      if (form.paymentGateway === 'COD') {
        clearCart() // Lưu ý: Cần xử lý Backend để chỉ xóa sản phẩm đã mua khỏi giỏ hàng
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
        <i className="fa-solid fa-credit-card text-indigo-500"></i>Thanh toán
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Form thông tin ── */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
          <div className="card p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-location-dot text-indigo-500"></i>Thông tin giao hàng
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
                  <input required className="input" value={form.shippingName}
                    onChange={e => setForm({ ...form, shippingName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Điện thoại *</label>
                  <input required className="input" value={form.shippingPhone}
                    onChange={e => setForm({ ...form, shippingPhone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ giao hàng *</label>
                <textarea required rows={2} className="input resize-none" value={form.shippingAddress}
                  onChange={e => setForm({ ...form, shippingAddress: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea rows={2} className="input resize-none"
                  placeholder="Ghi chú cho người giao hàng..."
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Phương thức thanh toán */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-wallet text-indigo-500"></i>Phương thức thanh toán
            </h2>
            <div className="space-y-3">
              {[
                { value: 'VNPAY', label: 'VNPay', desc: 'Thanh toán qua cổng VNPay', icon: 'fa-qrcode', badge: 'SANDBOX', badgeColor: 'bg-green-100 text-green-700' },
                { value: 'COD', label: 'COD', desc: 'Trả tiền mặt khi nhận hàng', icon: 'fa-money-bill-wave', badge: null },
              ].map(opt => (
                <label key={opt.value}
                  className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    form.paymentGateway === opt.value ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'
                  }`}>
                  <input type="radio" name="payment" value={opt.value}
                    checked={form.paymentGateway === opt.value}
                    onChange={() => setForm({ ...form, paymentGateway: opt.value })} />
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${form.paymentGateway === opt.value ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                    <i className={`fa-solid ${opt.icon} ${form.paymentGateway === opt.value ? 'text-indigo-500' : 'text-gray-400'}`}></i>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading || items.length === 0}
            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2">
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : null}
            {form.paymentGateway === 'VNPAY' ? 'Thanh toán qua VNPay' : 'Đặt hàng (COD)'}
          </button>
        </form>

        {/* ── Tóm tắt đơn hàng ── */}
        <div className="card p-6 h-fit sticky top-20 space-y-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-receipt text-gray-400"></i>
            Đơn hàng ({items.length})
          </h2>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {items.map(item => (
              <div key={item.productId} className="flex gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  <img src={item.productImage} className="w-full h-full object-cover" crossOrigin="anonymous" alt="" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 line-clamp-1">{item.productName}</p>
                  <p className="text-xs text-gray-400">×{item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-gray-700">{fmt(item.subtotal)}</p>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div className="border-t border-gray-100 pt-4">
            {coupon ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                <div className="flex-1">
                  <p className="text-sm font-bold text-emerald-700">{coupon.code}</p>
                  <p className="text-xs text-emerald-600">-{fmt(coupon.discountAmount)}</p>
                </div>
                <button onClick={handleRemoveCoupon} className="text-gray-400 hover:text-rose-500">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input className="input flex-1 text-sm uppercase" placeholder="Mã giảm giá"
                  value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())} />
                <button type="button" onClick={handleApplyCoupon} className="btn-primary px-4 py-2 text-sm">Áp dụng</button>
              </div>
            )}
          </div>

          {/* Tổng kết tiền */}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Tạm tính ({items.length} SP)</span>
              <span>{fmt(totalAmount)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600 font-medium">
                <span>Giảm giá</span>
                <span>-{fmt(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-500">
              <span>Phí ship</span>
              <span>{shippingFee === 0 ? 'Miễn phí' : fmt(shippingFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-800 text-lg pt-2 border-t border-gray-100">
              <span>Tổng cộng</span>
              <span className="text-indigo-600">{fmt(Math.max(0, finalAmount))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}