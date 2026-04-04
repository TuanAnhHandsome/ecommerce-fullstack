import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore(s => s.login)
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Chào mừng ${user.fullName}!`)

      // Dùng setTimeout để đảm bảo Zustand persist đã flush xong trước khi navigate
      setTimeout(() => {
        if (user.role === 'ADMIN') {
          navigate('/admin', { replace: true })
        } else {
          navigate(from === '/login' ? '/' : from, { replace: true })
        }
      }, 100)

    } catch (err) {
      toast.error(err.response?.data?.message || 'Email hoặc mật khẩu không đúng')
    } finally {
      setLoading(false)
    }
  }

  const fillTestAccount = (email, password) => {
    setForm({ email, password })
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <i className="fa-solid fa-right-to-bracket text-red-500 text-xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Đăng nhập</h1>
          <p className="text-gray-500 text-sm mt-1">Chào mừng bạn quay lại!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" required className="input"
              placeholder="email@example.com"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input
              type="password" required className="input"
              placeholder="Nhập mật khẩu"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading
              ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Đang đăng nhập...</>
              : <><i className="fa-solid fa-right-to-bracket mr-2"></i>Đăng nhập</>
            }
          </button>
        </form>

        {/* Test accounts */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs font-semibold text-blue-700 mb-2">
            <i className="fa-solid fa-vial mr-1"></i>Tài khoản test (click để điền):
          </p>
          <div className="flex gap-2">
            <button type="button"
              onClick={() => fillTestAccount('admin@ecommerce.vn', 'Admin@123')}
              className="text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors font-medium">
              <i className="fa-solid fa-user-shield mr-1"></i>Admin
            </button>
            <button type="button"
              onClick={() => fillTestAccount('user@ecommerce.vn', 'User@123')}
              className="text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors font-medium">
              <i className="fa-solid fa-user mr-1"></i>User
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-red-500 font-medium hover:text-red-600">Đăng ký</Link>
        </p>
      </div>
    </div>
  )
}