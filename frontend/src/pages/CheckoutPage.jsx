import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { orderAPI, paymentAPI } from '../services/api'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import AddressPickerModal from '../components/common/AddressPickerModal'
import CouponSection from '../components/checkout/CouponSection'
import { validateShippingForm } from '../utils/checkoutValidation'

const fmt = (p) => new Intl.NumberFormat('vi-VN').format(Number(p)) + 'đ'

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()

  /**
   * CartPage truyền: { cartItemIds: number[] }
   * OrderDetailPage truyền thêm: { prefill: { shippingName, shippingPhone,
   *   shippingAddress, note, paymentGateway } } khi retry payment
   */
  const cartItemIds = location.state?.cartItemIds || []
  const prefill = location.state?.prefill || null

  const { items: cartItems, fetchCart } = useCartStore()
  const { user } = useAuthStore()

  const [loading, setLoading] = useState(false)
  const [coupon, setCoupon] = useState(null)
  const [showAddressPicker, setShowAddressPicker] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  // Ưu tiên prefill (từ retry) → user profile → rỗng
  const [form, setForm] = useState({
    shippingName: prefill?.shippingName ?? user?.fullName ?? '',
    shippingPhone: prefill?.shippingPhone ?? user?.phone ?? '',
    shippingAddress: prefill?.shippingAddress ?? user?.address ?? '',
    note: prefill?.note ?? '',
    paymentGateway: prefill?.paymentGateway ?? 'VNPAY',
  })

  // Theo dõi xem địa chỉ có đang dùng mặc định từ profile không
  const isUsingDefaultAddress =
    !!user?.address && form.shippingAddress === user.address

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
  const totalAmount = items.reduce((sum, item) => sum + Number(item.subtotal), 0)
  const shippingFee = totalAmount >= 500_000 ? 0 : (totalAmount > 0 ? 30_000 : 0)
  const discountAmount = coupon?.discountAmount ? Number(coupon.discountAmount) : 0
  const finalAmount = Math.max(0, totalAmount - discountAmount + shippingFee)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (items.length === 0) {
      toast.error('Không có sản phẩm nào để thanh toán!')
      return
    }

    const { success, errors, data: validData } = validateShippingForm(form)
    if (!success) {
      setFieldErrors(errors)
      toast.error('Vui lòng kiểm tra lại thông tin giao hàng')
      return
    }
    setFieldErrors({})

    setLoading(true)
    try {
      const { data: order } = await orderAPI.create({
        cartItemIds,
        shippingName: validData.shippingName,
        shippingPhone: validData.shippingPhone,
        shippingAddress: validData.shippingAddress,
        note: validData.note,
        paymentGateway: validData.paymentGateway,
        couponCode: coupon?.code ?? null,
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
    <>
      {/* ── Address Picker Modal ── */}
      {showAddressPicker && (
        <AddressPickerModal
          initialValue={form.shippingAddress}
          onConfirm={(address) => {
            setForm(f => ({ ...f, shippingAddress: address }))
            setShowAddressPicker(false)
          }}
          onCancel={() => setShowAddressPicker(false)}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Banner nhắc khi đây là retry flow */}
        {prefill && (
          <div className="mb-5 flex items-center gap-3 bg-yellow-50 border border-yellow-200
            rounded-xl px-4 py-3 text-sm text-yellow-700">
            <i className="fa-solid fa-rotate-right flex-shrink-0" />
            <span>Bạn đang thanh toán lại cho đơn hàng chưa hoàn tất.
              Kiểm tra và chỉnh sửa thông tin nếu cần trước khi tiếp tục.</span>
          </div>
        )}

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
                      className={`input ${fieldErrors.shippingName ? 'border-red-300 bg-red-50 focus:ring-red-400' : ''}`}
                      value={form.shippingName}
                      onChange={e => {
                        setForm(f => ({ ...f, shippingName: e.target.value }))
                        if (fieldErrors.shippingName) setFieldErrors(fe => ({ ...fe, shippingName: undefined }))
                      }}
                      placeholder="Nguyễn Văn A"
                    />
                    {fieldErrors.shippingName && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.shippingName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      className={`input ${fieldErrors.shippingPhone ? 'border-red-300 bg-red-50 focus:ring-red-400' : ''}`}
                      value={form.shippingPhone}
                      onChange={e => {
                        setForm(f => ({ ...f, shippingPhone: e.target.value }))
                        if (fieldErrors.shippingPhone) setFieldErrors(fe => ({ ...fe, shippingPhone: undefined }))
                      }}
                      placeholder="0901 234 567"
                    />
                    {fieldErrors.shippingPhone && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.shippingPhone}</p>
                    )}
                  </div>
                </div>

                {/* ── Địa chỉ giao hàng với Address Picker ── */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ giao hàng <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 items-start">
                    <textarea
                      required
                      rows={2}
                      className={`input resize-none flex-1 ${fieldErrors.shippingAddress ? 'border-red-300 bg-red-50 focus:ring-red-400' : ''}`}
                      value={form.shippingAddress}
                      onChange={e => {
                        setForm(f => ({ ...f, shippingAddress: e.target.value }))
                        if (fieldErrors.shippingAddress) setFieldErrors(fe => ({ ...fe, shippingAddress: undefined }))
                      }}
                      placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddressPicker(true)}
                      className="flex-shrink-0 h-[68px] px-3 rounded-xl border border-gray-200
                                 hover:border-indigo-300 hover:bg-indigo-50 transition-colors
                                 text-gray-400 hover:text-indigo-500
                                 flex flex-col items-center justify-center gap-1"
                      title="Chọn trên bản đồ"
                    >
                      <i className="fa-solid fa-map-location-dot text-lg" />
                      <span className="text-[10px] font-medium">Bản đồ</span>
                    </button>
                  </div>

                  {/* Badge: đang dùng địa chỉ mặc định */}
                  {isUsingDefaultAddress ? (
                    <p className="text-xs text-indigo-500 mt-1.5 flex items-center gap-1">
                      <i className="fa-solid fa-circle-check" />
                      Đang dùng địa chỉ mặc định từ tài khoản
                      <button
                        type="button"
                        onClick={() => setShowAddressPicker(true)}
                        className="ml-1 underline underline-offset-2 hover:text-indigo-700 transition-colors"
                      >
                        Thay đổi?
                      </button>
                    </p>
                  ) : user?.address && form.shippingAddress !== user.address && form.shippingAddress ? (
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <i className="fa-solid fa-pen-to-square" />
                      Địa chỉ đã được thay đổi so với mặc định.
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, shippingAddress: user.address }))}
                        className="ml-1 underline underline-offset-2 hover:text-gray-600 transition-colors"
                      >
                        Dùng lại địa chỉ mặc định?
                      </button>
                    </p>
                  ) : null}
                  {fieldErrors.shippingAddress && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <i className="fa-solid fa-circle-exclamation" />{fieldErrors.shippingAddress}
                    </p>
                  )}
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

            {/* Product list */}
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
    </>
  )
}