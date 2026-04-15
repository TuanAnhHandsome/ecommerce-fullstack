import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore(s => s.login)

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [touched, setTouched] = useState({})

  const from = location.state?.from?.pathname || '/'

  const validateField = (name, value) => {
    if (name === 'email') {
      if (!value) return 'Email không được để trống'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email không đúng định dạng'
    }
    if (name === 'password') {
      if (!value) return 'Mật khẩu không được để trống'
    }
    return ''
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {
      email: validateField('email', form.email),
      password: validateField('password', form.password),
    }
    setErrors(newErrors)
    setTouched({ email: true, password: true })
    if (Object.values(newErrors).some(Boolean)) return

    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Chào mừng ${user.fullName}!`)
      setTimeout(() => {
        if (user.role === 'ADMIN') navigate('/admin', { replace: true })
        else navigate(from === '/login' ? '/' : from, { replace: true })
      }, 100)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email hoặc mật khẩu không đúng')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (name) =>
    `w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none bg-white
    ${errors[name] && touched[name]
      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
      : touched[name] && !errors[name]
        ? 'border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-100'
        : 'border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100'
    }`

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-400 rounded-2xl shadow-lg mb-4">
            <i className="fa-solid fa-bag-shopping text-white text-2xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Đăng nhập</h1>
          <p className="text-gray-500 mt-1 text-sm">Chào mừng bạn quay lại EShop!</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  <i className="fa-solid fa-envelope"></i>
                </span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
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

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Mật khẩu
                </label>
                <Link to="/forgot-password" className="text-xs text-red-500 hover:text-red-600 transition-colors">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  <i className="fa-solid fa-lock"></i>
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu của bạn"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${inputClass('password')} pl-10 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                </button>
              </div>
              {errors.password && touched.password && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <i className="fa-solid fa-circle-exclamation"></i> {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-orange-400 text-white rounded-xl font-semibold
                         hover:from-red-600 hover:to-orange-500 active:scale-[.98] transition-all shadow-md
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fa-solid fa-spinner fa-spin"></i> Đang đăng nhập...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <i className="fa-solid fa-right-to-bracket"></i> Đăng nhập
                </span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400">hoặc</span>
            </div>
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-gray-500">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-red-500 font-semibold hover:text-red-600 transition-colors">
              Đăng ký ngay
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Bằng cách đăng nhập, bạn đồng ý với{' '}
          <span className="text-gray-500 underline cursor-pointer">Điều khoản dịch vụ</span>
          {' '}và{' '}
          <span className="text-gray-500 underline cursor-pointer">Chính sách bảo mật</span>
        </p>
      </div>
    </div>
  )
}