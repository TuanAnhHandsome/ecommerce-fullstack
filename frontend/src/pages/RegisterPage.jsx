import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore(s => s.register)
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.fullName.trim() || form.fullName.length < 2) e.fullName = 'Họ tên tối thiểu 2 ký tự'
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Email không hợp lệ'
    if (form.password.length < 8) e.password = 'Mật khẩu tối thiểu 8 ký tự'
    if (!form.password.match(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/))
      e.password = 'Phải có chữ hoa, chữ thường và số'
    if (form.phone && !form.phone.match(/^[0-9]{10,11}$/)) e.phone = 'Số điện thoại không hợp lệ'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await register(form)
      toast.success('Đăng ký thành công! Chào mừng bạn!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="card p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <i className="fa-solid fa-user-plus text-red-500 text-xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Tạo tài khoản</h1>
          <p className="text-gray-500 text-sm mt-1">Tham gia EShop ngay hôm nay!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <i className="fa-solid fa-user mr-1 text-gray-400"></i>Họ và tên *
            </label>
            <input type="text" className={`input ${errors.fullName ? 'border-red-400' : ''}`}
              placeholder="Nguyễn Văn A" value={form.fullName}
              onChange={e => setForm({...form, fullName: e.target.value})} />
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <i className="fa-solid fa-envelope mr-1 text-gray-400"></i>Email *
            </label>
            <input type="email" className={`input ${errors.email ? 'border-red-400' : ''}`}
              placeholder="email@example.com" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <i className="fa-solid fa-lock mr-1 text-gray-400"></i>Mật khẩu *
            </label>
            <input type="password" className={`input ${errors.password ? 'border-red-400' : ''}`}
              placeholder="Tối thiểu 8 ký tự" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})} />
            {errors.password
              ? <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              : <p className="text-gray-400 text-xs mt-1">Phải có chữ hoa, chữ thường và số</p>
            }
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <i className="fa-solid fa-phone mr-1 text-gray-400"></i>Số điện thoại
            </label>
            <input type="tel" className={`input ${errors.phone ? 'border-red-400' : ''}`}
              placeholder="0912345678" value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})} />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading
              ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Đang tạo tài khoản...</>
              : <><i className="fa-solid fa-user-plus mr-2"></i>Đăng ký</>
            }
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-red-500 font-medium hover:text-red-600">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  )
}