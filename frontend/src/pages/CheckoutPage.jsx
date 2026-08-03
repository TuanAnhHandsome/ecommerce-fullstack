import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { orderAPI, paymentAPI, couponAPI } from '../services/api'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const fmt = (p) => new Intl.NumberFormat('vi-VN').format(Number(p)) + 'đ'

// ─── Coupon component ─────────────────────────────────────────────────────────
function CouponSection({ totalAmount, coupon, setCoupon }) {
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [shaking, setShaking] = useState(false)

  // Reset coupon khi totalAmount thay đổi (user đổi sản phẩm)
  useEffect(() => {
    if (coupon) {
      setCoupon(null)
      toast('Mã giảm giá đã bị xóa do giỏ hàng thay đổi', { icon: 'ℹ️' })
    }
  }, [totalAmount]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    try {
      const { data } = await couponAPI.apply(input.trim(), totalAmount)
      setCoupon(data)
      setInput('')
      toast.success(`Áp dụng thành công! Giảm ${fmt(data.discountAmount)}`)
    } catch (err) {
      const msg = err.response?.data?.message || 'Mã không hợp lệ hoặc đã hết hạn'
      setError(msg)
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = () => {
    setCoupon(null)
    setInput('')
    setError('')
  }

  if (coupon) return (
    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
      <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <i className="fa-solid fa-tag text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-emerald-800 font-mono">{coupon.code}</p>
        <p className="text-xs text-emerald-600">Giảm {fmt(coupon.discountAmount)}</p>
      </div>
      <button
        onClick={handleRemove}
        className="w-7 h-7 rounded-full hover:bg-emerald-200 flex items-center justify-center
                   text-emerald-600 hover:text-red-500 transition-colors"
        title="Xoá mã"
      >
        <i className="fa-solid fa-xmark text-xs" />
      </button>
    </div>
  )

  return (
    <div>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-5px)}
          40%{transform:translateX(5px)}
          60%{transform:translateX(-3px)}
          80%{transform:translateX(3px)}
        }
        .shake { animation: shake 0.45s ease-in-out; }
      `}</style>
      <div className={`flex gap-2 ${shaking ? 'shake' : ''}`}>
        <input
          className={`input flex-1 text-sm font-mono uppercase placeholder:normal-case placeholder:font-sans
            ${error ? 'border-red-300 bg-red-50 focus:ring-red-400' : ''}`}
          placeholder="Nhập mã giảm giá..."
          value={input}
          onChange={e => { setInput(e.target.value.toUpperCase()); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleApply()}
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={loading || !input.trim()}
          className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5"
        >
          {loading && <i className="fa-solid fa-spinner fa-spin" />}
          Áp dụng
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
          <i className="fa-solid fa-circle-exclamation" />{error}
        </p>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const navigate  = useNavigate()
  const location  = useLocation()

  /**
   * CartPage truyền: { cartItemIds: number[] }
   * cartItemIds là mảng CartItem.id (không phải productId)
   */
  const cartItemIds = location.state?.cartItemIds || []

  const { items: cartItems, fetchCart } = useCartStore()
  const { user } = useAuthStore()

  const [loading, setLoading] = useState(false)
  const [coupon, setCoupon]   = useState(null)

  const [form, setForm] = useState({
    shippingName:    user?.fullName  || '',
    shippingPhone:   user?.phone     || '',
    shippingAddress: user?.address   || '',
    note:            '',
    paymentGateway:  'VNPAY',
  })

  // Fetch cart để có đủ thông tin hiển thị
  useEffect(() => {
    fetchCart()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect nếu không có cartItemIds
  useEffect(() => {
    if (cartItemIds.length === 0) {
      toast.error('Vui lòng chọn sản phẩm cần thanh toán từ giỏ hàng')
      navigate('/cart')
    }
  }, [cartItemIds, navigate])

  // Lọc items để hiển thị — dùng item.id (cartItemId)
  const items = useMemo(
    () => cartItems.filter(item => cartItemIds.includes(item.id)),
    [cartItems, cartItemIds]
  )

  // Tính tiền phía client chỉ để HIỂN THỊ — backend sẽ tính lại chính xác
  const totalAmount    = items.reduce((sum, item) => sum + Number(item.subtotal), 0)
  const shippingFee    = totalAmount >= 500_000 ? 0 : (totalAmount > 0 ? 30_000 : 0)
  const discountAmount = coupon?.discountAmount ? Number(coupon.discountAmount) : 0
  const finalAmount    = Math.max(0, totalAmount - discountAmount + shippingFee)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (items.length === 0) {
      toast.error('Không có sản phẩm nào để thanh toán!')
      return
    }
    setLoading(true)
    try {
      // Gửi cartItemIds để backend tự lấy đúng items + tính tiền
      const { data: order } = await orderAPI.create({
        cartItemIds,            // ← danh sách CartItem.id
        shippingName:    form.shippingName,
        shippingPhone:   form.shippingPhone,
        shippingAddress: form.shippingAddress,
        note:            form.note,
        paymentGateway:  form.paymentGateway,
        couponCode:      coupon?.code ?? null,
      })

      if (form.paymentGateway === 'COD') {
        toast.success('Đặt hàng thành công!')
        navigate(`/orders/${order.id}`, { replace: true })
        return
      }

      // VNPay: redirect sang cổng thanh toán
      const { data: payment } = await paymentAPI.createVNPay(order.id)
      window.location.href = payment.paymentUrl
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt hàng thất bại, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  if (cartItemIds.length === 0) return null // đang redirect

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <i className="fa-solid fa-credit-card text-indigo-500" />
        Thanh toán
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Form bên trái ── */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">

          {/* Thông tin giao hàng */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-location-dot text-indigo-500" />
              Thông tin giao hàng
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    className="input"
                    value={form.shippingName}
                    onChange={e => setForm(f => ({ ...f, shippingName: e.target.value }))}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    className="input"
                    value={form.shippingPhone}
                    onChange={e => setForm(f => ({ ...f, shippingPhone: e.target.value }))}
                    placeholder="0901 234 567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ giao hàng <span className="text-red-500">*</span>
                </label>
                <textarea
                  required rows={2} className="input resize-none"
                  value={form.shippingAddress}
                  onChange={e => setForm(f => ({ ...f, shippingAddress: e.target.value }))}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  rows={2} className="input resize-none"
                  placeholder="Ghi chú cho người giao hàng..."
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Phương thức thanh toán */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-wallet text-indigo-500" />
              Phương thức thanh toán
            </h2>
            <div className="space-y-3">
              {[
                {
                  value: 'VNPAY', label: 'VNPay',
                  desc: 'Thanh toán qua cổng VNPay', icon: 'fa-qrcode',
                  badge: 'SANDBOX', badgeColor: 'bg-green-100 text-green-700',
                },
                {
                  value: 'COD', label: 'COD',
                  desc: 'Trả tiền mặt khi nhận hàng', icon: 'fa-money-bill-wave',
                  badge: null,
                },
              ].map(opt => {
                const active = form.paymentGateway === opt.value
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all
                      ${active ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <input
                      type="radio" name="payment" value={opt.value}
                      checked={active}
                      onChange={() => setForm(f => ({ ...f, paymentGateway: opt.value }))}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      ${active ? 'border-indigo-500' : 'border-gray-300'}`}>
                      {active && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                      ${active ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                      <i className={`fa-solid ${opt.icon} ${active ? 'text-indigo-500' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800">{opt.label}</p>
                        {opt.badge && (
                          <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${opt.badgeColor}`}>
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{opt.desc}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <i className="fa-solid fa-spinner fa-spin" />}
            {form.paymentGateway === 'VNPAY'
              ? <><i className="fa-solid fa-qrcode" />Thanh toán qua VNPay</>
              : <><i className="fa-solid fa-bag-shopping" />Đặt hàng (COD)</>
            }
          </button>
        </form>

        {/* ── Tóm tắt bên phải ── */}
        <div className="card p-6 h-fit sticky top-20 space-y-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-receipt text-gray-400" />
            Đơn hàng ({items.length} sản phẩm)
          </h2>

          {/* Product list — key dùng item.id */}
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {items.map(item => (
              <div key={item.id} className="flex gap-3 items-start">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden border border-gray-100">
                  {item.productImage
                    ? <img src={item.productImage} className="w-full h-full object-cover"
                           crossOrigin="anonymous" alt="" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <i className="fa-solid fa-image text-gray-300" />
                      </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 line-clamp-1">
                    {item.productName}
                  </p>
                  {/* Hiển thị variant nếu có */}
                  {item.variantValues && Object.keys(item.variantValues).length > 0 && (
                    <p className="text-xs text-gray-400">
                      {Object.entries(item.variantValues).map(([k, v]) => `${k}: ${v}`).join(' / ')}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">×{item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-gray-700 flex-shrink-0">
                  {fmt(item.subtotal)}
                </p>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <i className="fa-solid fa-ticket text-gray-400" />
              Mã giảm giá
            </p>
            <CouponSection
              totalAmount={totalAmount}
              coupon={coupon}
              setCoupon={setCoupon}
            />
          </div>

          {/* Tổng kết */}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Tạm tính ({items.length} SP)</span>
              <span>{fmt(totalAmount)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600 font-medium">
                <span className="flex items-center gap-1">
                  <i className="fa-solid fa-tag text-xs" />Giảm giá
                </span>
                <span>−{fmt(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-500">
              <span>Phí ship</span>
              <span className={shippingFee === 0 ? 'text-green-600 font-medium' : ''}>
                {shippingFee === 0
                  ? <><i className="fa-solid fa-gift text-xs mr-1" />Miễn phí</>
                  : fmt(shippingFee)
                }
              </span>
            </div>
            <div className="flex justify-between font-bold text-gray-800 text-lg pt-2 border-t border-gray-100">
              <span>Tổng cộng</span>
              <span className="text-indigo-600">{fmt(finalAmount)}</span>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
            <i className="fa-solid fa-lock text-gray-300" />
            Thông tin được bảo mật an toàn
          </p>
        </div>
      </div>
    </div>
  )
}