import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { couponAPI } from '../../services/api'

const fmt = (p) => new Intl.NumberFormat('vi-VN').format(Number(p)) + 'đ'

/**
 * Ô nhập & áp dụng mã giảm giá tại trang Checkout.
 * Tách ra khỏi CheckoutPage.jsx để giữ file trang checkout gọn hơn
 * và có thể tái sử dụng CouponSection ở nơi khác (vd. CartPage) nếu cần.
 */
export default function CouponSection({ totalAmount, coupon, setCoupon }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
