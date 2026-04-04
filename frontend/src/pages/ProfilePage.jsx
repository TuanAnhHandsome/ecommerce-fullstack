import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { userAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { updateUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('info')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState(null)

  const [infoForm, setInfoForm] = useState({
    fullName: '', phone: '', address: ''
  })
  const [pwForm, setPwForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  })
  const [showPw, setShowPw] = useState({
    currentPassword: false, newPassword: false, confirmPassword: false
  })

  useEffect(() => {
    userAPI.getProfile().then(({ data }) => {
      setProfile(data.data)
      setInfoForm({
        fullName: data.data.fullName || '',
        phone: data.data.phone || '',
        address: data.data.address || '',
      })
    }).catch(() => toast.error('Không thể tải thông tin tài khoản'))
  }, [])

  const handleUpdateInfo = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await userAPI.updateProfile(infoForm)
      setProfile(data.data)
      updateUser(data.data)
      toast.success('Cập nhật thành công!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }
    setLoading(true)
    try {
      await userAPI.changePassword(pwForm)
      toast.success('Đổi mật khẩu thành công!')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'info',     label: 'Thông tin', icon: 'fa-user'         },
    { id: 'password', label: 'Mật khẩu',  icon: 'fa-lock'         },
  ]

  const pwFields = [
    { key: 'currentPassword', label: 'Mật khẩu hiện tại'     },
    { key: 'newPassword',     label: 'Mật khẩu mới'           },
    { key: 'confirmPassword', label: 'Xác nhận mật khẩu mới' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <i className="fa-solid fa-circle-user text-red-500"></i>
        Tài khoản của tôi
      </h1>

      {/* Avatar card */}
      <div className="card p-6 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-2xl font-bold text-red-500 flex-shrink-0">
          {profile?.fullName?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="font-bold text-gray-800 text-lg">{profile?.fullName || '...'}</p>
          <p className="text-gray-400 text-sm mb-1">{profile?.email}</p>
          <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
            {profile?.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-red-500 text-white shadow'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-red-300'
            }`}
          >
            <i className={`fa-solid ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Thông tin */}
      {activeTab === 'info' && (
        <form onSubmit={handleUpdateInfo} className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-700 mb-2">Cập nhật thông tin cá nhân</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <i className="fa-solid fa-user mr-1 text-gray-400"></i>Họ tên
            </label>
            <input
              className="input"
              value={infoForm.fullName}
              onChange={e => setInfoForm({ ...infoForm, fullName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <i className="fa-solid fa-envelope mr-1 text-gray-400"></i>Email
            </label>
            <input className="input bg-gray-50 cursor-not-allowed" value={profile?.email || ''} disabled />
            <p className="text-xs text-gray-400 mt-1">Email không thể thay đổi</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <i className="fa-solid fa-phone mr-1 text-gray-400"></i>Số điện thoại
            </label>
            <input
              className="input"
              value={infoForm.phone}
              onChange={e => setInfoForm({ ...infoForm, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <i className="fa-solid fa-map-pin mr-1 text-gray-400"></i>Địa chỉ
            </label>
            <textarea
              rows={2}
              className="input resize-none"
              value={infoForm.address}
              onChange={e => setInfoForm({ ...infoForm, address: e.target.value })}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading
              ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Đang lưu...</>
              : <><i className="fa-solid fa-floppy-disk mr-2"></i>Lưu thay đổi</>
            }
          </button>
        </form>
      )}

      {/* Tab: Đổi mật khẩu */}
      {activeTab === 'password' && (
        <form onSubmit={handleChangePassword} className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-700 mb-2">Đổi mật khẩu</h2>

          {pwFields.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <div className="relative">
                <input
                  type={showPw[key] ? 'text' : 'password'}
                  className="input pr-10"
                  value={pwForm[key]}
                  onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPw({ ...showPw, [key]: !showPw[key] })}
                >
                  <i className={`fa-solid ${showPw[key] ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
          ))}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700">
            <i className="fa-solid fa-triangle-exclamation mr-1"></i>
            Mật khẩu mới tối thiểu 6 ký tự
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading
              ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Đang lưu...</>
              : <><i className="fa-solid fa-lock mr-2"></i>Đổi mật khẩu</>
            }
          </button>
        </form>
      )}
    </div>
  )
}
