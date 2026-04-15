import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

// ─── Step indicator ───────────────────────────────────────────────
function StepBar({ step }) {
  const steps = ['Thông tin', 'Xác thực OTP', 'Hoàn tất']
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${i < step
                ? 'bg-green-500 text-white'
                : i === step
                  ? 'bg-gradient-to-br from-red-500 to-orange-400 text-white shadow-md'
                  : 'bg-gray-100 text-gray-400'}`}>
              {i < step
                ? <i className="fa-solid fa-check text-xs"></i>
                : i + 1}
            </div>
            <span className={`text-xs mt-1 whitespace-nowrap font-medium transition-colors
              ${i === step ? 'text-red-500' : i < step ? 'text-green-500' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 flex-1 mx-2 mb-5 transition-all rounded
              ${i < step ? 'bg-green-400' : 'bg-gray-100'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Password strength ────────────────────────────────────────────
function PasswordStrength({ password }) {
  const checks = [
    { label: 'Tối thiểu 8 ký tự', ok: password.length >= 8 },
    { label: 'Có chữ thường', ok: /[a-z]/.test(password) },
    { label: 'Có chữ HOA', ok: /[A-Z]/.test(password) },
    { label: 'Có chữ số', ok: /\d/.test(password) },
  ]
  const score = checks.filter(c => c.ok).length
  const levels = ['', 'Yếu', 'Trung bình', 'Khá', 'Mạnh']
  const colors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500']
  const textColors = ['', 'text-red-500', 'text-orange-500', 'text-yellow-600', 'text-green-600']

  if (!password) return null
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= score ? colors[score] : 'bg-gray-100'}`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {checks.map((c, i) => (
            <span key={i} className={`text-xs flex items-center gap-1 ${c.ok ? 'text-green-600' : 'text-gray-400'}`}>
              <i className={`fa-solid ${c.ok ? 'fa-circle-check' : 'fa-circle'} text-xs`}></i>
              {c.label}
            </span>
          ))}
        </div>
        <span className={`text-xs font-semibold ml-2 ${textColors[score]}`}>{levels[score]}</span>
      </div>
    </div>
  )
}

// ─── OTP Input ────────────────────────────────────────────────────
function OtpInput({ value, onChange }) {
  const inputs = useRef([])
  const digits = (value + '      ').slice(0, 6).split('')

  const handleKey = (e, i) => {
    if (e.key === 'Backspace') {
      const next = digits.map((d, idx) => idx === i ? ' ' : d).join('').trimEnd()
      onChange(next.replace(/ /g, ''))
      if (i > 0) setTimeout(() => inputs.current[i - 1]?.focus(), 0)
    }
  }

  const handleChange = (e, i) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1)
    const next = digits.map((d, idx) => idx === i ? (char || ' ') : d).join('').trimEnd()
    onChange(next.replace(/ /g, ''))
    if (char && i < 5) setTimeout(() => inputs.current[i + 1]?.focus(), 0)
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    setTimeout(() => inputs.current[Math.min(pasted.length, 5)]?.focus(), 0)
    e.preventDefault()
  }

  return (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3, 4, 5].map(i => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i].trim()}
          onChange={e => handleChange(e, i)}
          onKeyDown={e => handleKey(e, i)}
          onPaste={handlePaste}
          onClick={() => inputs.current[i]?.select()}
          className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all
            ${digits[i].trim()
              ? 'border-red-400 bg-red-50 text-red-600'
              : 'border-gray-200 bg-gray-50 text-gray-800'}
            focus:border-red-500 focus:bg-white focus:shadow-md`}
        />
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore(s => s.register)

  const [step, setStep] = useState(0)   // 0: form, 1: otp, 2: done
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '' })
  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(c => c - 1), 1000)
    }
    return () => clearTimeout(timerRef.current)
  }, [countdown])

  const validateField = (name, value) => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Họ tên không được để trống'
        if (value.trim().length < 2) return 'Họ tên tối thiểu 2 ký tự'
        return ''
      case 'email':
        if (!value) return 'Email không được để trống'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email không đúng định dạng'
        return ''
      case 'password':
        if (!value) return 'Mật khẩu không được để trống'
        if (value.length < 8) return 'Mật khẩu tối thiểu 8 ký tự'
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) return 'Phải có chữ hoa, chữ thường và số'
        return ''
      case 'phone':
        if (value && !/^[0-9]{10,11}$/.test(value)) return 'Số điện thoại không hợp lệ (10-11 số)'
        return ''
      default:
        return ''
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (touched[name]) {
      setErrors(ev => ({ ...ev, [name]: validateField(name, value) }))
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched(t => ({ ...t, [name]: true }))
    setErrors(ev => ({ ...ev, [name]: validateField(name, value) }))
  }

  const validateForm = () => {
    const e = {}
    Object.keys(form).forEach(k => {
      const msg = validateField(k, form[k])
      if (msg) e[k] = msg
    })
    setErrors(e)
    setTouched({ fullName: true, email: true, password: true, phone: true })
    return Object.keys(e).length === 0
  }

  // Step 0 → 1: gửi OTP
  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)
    try {
      await authAPI.sendOtp(form.email)
      toast.success('Mã OTP đã được gửi đến email của bạn!')
      setStep(1)
      setCountdown(60)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi OTP, thử lại sau')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResend = async () => {
    if (countdown > 0) return
    setLoading(true)
    try {
      await authAPI.sendOtp(form.email)
      toast.success('Đã gửi lại mã OTP!')
      setCountdown(60)
      setOtp('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi lại OTP')
    } finally {
      setLoading(false)
    }
  }

  // Step 1 → 2: verify OTP + register
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault()
    if (otp.length < 6) {
      toast.error('Vui lòng nhập đủ 6 chữ số')
      return
    }
    setLoading(true)
    try {
      // verify OTP
      await authAPI.verifyOtp(form.email, otp)
      // register
      await register(form)
      setStep(2)
      toast.success('Đăng ký thành công! Chào mừng bạn đến với EShop 🎉')
      setTimeout(() => navigate('/'), 2000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xác thực thất bại, kiểm tra lại mã OTP')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (name) =>
    `w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none bg-white
    ${errors[name] && touched[name]
      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
      : touched[name] && !errors[name] && form[name]
        ? 'border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-100'
        : 'border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100'
    }`

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-400 rounded-2xl shadow-lg mb-4">
            <i className="fa-solid fa-bag-shopping text-white text-2xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Tạo tài khoản</h1>
          <p className="text-gray-500 mt-1 text-sm">Tham gia EShop ngay hôm nay!</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <StepBar step={step} />

          {/* ── STEP 0: Form thông tin ── */}
          {step === 0 && (
            <form onSubmit={handleSendOtp} className="space-y-4" noValidate>

              {/* Họ tên */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Họ và tên <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    <i className="fa-solid fa-user"></i>
                  </span>
                  <input
                    type="text" name="fullName" autoComplete="name"
                    placeholder="Nguyễn Văn A"
                    value={form.fullName} onChange={handleChange} onBlur={handleBlur}
                    className={`${inputClass('fullName')} pl-10`}
                  />
                  {touched.fullName && !errors.fullName && form.fullName && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-500 text-sm">
                      <i className="fa-solid fa-circle-check"></i>
                    </span>
                  )}
                </div>
                {errors.fullName && touched.fullName && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <i className="fa-solid fa-circle-exclamation"></i> {errors.fullName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    <i className="fa-solid fa-envelope"></i>
                  </span>
                  <input
                    type="email" name="email" autoComplete="email"
                    placeholder="email@example.com"
                    value={form.email} onChange={handleChange} onBlur={handleBlur}
                    className={`${inputClass('email')} pl-10`}
                  />
                  {touched.email && !errors.email && form.email && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-500 text-sm">
                      <i className="fa-solid fa-circle-check"></i>
                    </span>
                  )}
                </div>
                {errors.email && touched.email && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <i className="fa-solid fa-circle-exclamation"></i> {errors.email}
                  </p>
                )}
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mật khẩu <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    <i className="fa-solid fa-lock"></i>
                  </span>
                  <input
                    type={showPass ? 'text' : 'password'} name="password"
                    autoComplete="new-password"
                    placeholder="Tối thiểu 8 ký tự"
                    value={form.password} onChange={handleChange} onBlur={handleBlur}
                    className={`${inputClass('password')} pl-10 pr-10`}
                  />
                  <button
                    type="button" tabIndex={-1}
                    onClick={() => setShowPass(s => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                  </button>
                </div>
                {errors.password && touched.password && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <i className="fa-solid fa-circle-exclamation"></i> {errors.password}
                  </p>
                )}
                <PasswordStrength password={form.password} />
              </div>

              {/* SĐT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Số điện thoại
                  <span className="text-gray-400 font-normal text-xs ml-1">(không bắt buộc)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    <i className="fa-solid fa-phone"></i>
                  </span>
                  <input
                    type="tel" name="phone" autoComplete="tel"
                    placeholder="0912 345 678"
                    value={form.phone} onChange={handleChange} onBlur={handleBlur}
                    className={`${inputClass('phone')} pl-10`}
                  />
                  {touched.phone && !errors.phone && form.phone && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-500 text-sm">
                      <i className="fa-solid fa-circle-check"></i>
                    </span>
                  )}
                </div>
                {errors.phone && touched.phone && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <i className="fa-solid fa-circle-exclamation"></i> {errors.phone}
                  </p>
                )}
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-orange-400 text-white rounded-xl font-semibold
                           hover:from-red-600 hover:to-orange-500 active:scale-[.98] transition-all shadow-md
                           disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-spinner fa-spin"></i> Đang gửi mã OTP...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Tiếp theo <i className="fa-solid fa-arrow-right"></i>
                  </span>
                )}
              </button>
            </form>
          )}

          {/* ── STEP 1: Nhập OTP ── */}
          {step === 1 && (
            <form onSubmit={handleVerifyAndRegister} className="space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <i className="fa-solid fa-mobile-screen-button text-red-500 text-2xl"></i>
                </div>
                <p className="text-gray-600 text-sm">
                  Mã xác thực đã được gửi đến
                </p>
                <p className="font-semibold text-gray-800 mt-0.5">{form.email}</p>
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="text-xs text-red-500 hover:text-red-600 mt-1 transition-colors"
                >
                  <i className="fa-solid fa-pen-to-square mr-1"></i>Đổi email
                </button>
              </div>

              <div>
                <p className="text-center text-sm text-gray-500 mb-4">Nhập mã 6 chữ số</p>
                <OtpInput value={otp} onChange={setOtp} />
              </div>

              {/* Countdown + resend */}
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-400">
                    Gửi lại sau{' '}
                    <span className="font-semibold text-red-500">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors disabled:opacity-50"
                  >
                    <i className="fa-solid fa-rotate-right mr-1"></i>Gửi lại mã OTP
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-orange-400 text-white rounded-xl font-semibold
                           hover:from-red-600 hover:to-orange-500 active:scale-[.98] transition-all shadow-md
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-spinner fa-spin"></i> Đang xác thực...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-shield-halved"></i> Xác nhận & Đăng ký
                  </span>
                )}
              </button>
            </form>
          )}

          {/* ── STEP 2: Hoàn tất ── */}
          {step === 2 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <i className="fa-solid fa-circle-check text-green-500 text-4xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Đăng ký thành công!</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Chào mừng <span className="font-semibold text-gray-700">{form.fullName}</span> đến với EShop!
                </p>
              </div>
              <p className="text-xs text-gray-400">Đang chuyển hướng về trang chủ...</p>
              <div className="flex justify-center">
                <div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          )}

          {/* Link đăng nhập (chỉ hiện ở step 0 & 1) */}
          {step < 2 && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-400">hoặc</span>
                </div>
              </div>
              <p className="text-center text-sm text-gray-500">
                Đã có tài khoản?{' '}
                <Link to="/login" className="text-red-500 font-semibold hover:text-red-600 transition-colors">
                  Đăng nhập ngay
                </Link>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Bằng cách đăng ký, bạn đồng ý với{' '}
          <span className="text-gray-500 underline cursor-pointer">Điều khoản dịch vụ</span>
          {' '}và{' '}
          <span className="text-gray-500 underline cursor-pointer">Chính sách bảo mật</span>
        </p>
      </div>
    </div>
  )
}