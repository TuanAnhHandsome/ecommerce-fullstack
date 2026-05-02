import { useState, useEffect, useRef } from 'react'
import { userAPI } from '../../services/api'
import toast from 'react-hot-toast'

/**
 * Modal yêu cầu nhập mật khẩu trước khi truy cập trang.
 * Props:
 *   onSuccess  — callback khi xác thực thành công
 *   onCancel   — callback khi người dùng đóng / huỷ
 */
export default function PasswordGateModal({ onSuccess, onCancel }) {
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const inputRef                = useRef(null)

  // Auto-focus input khi modal mở
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [])

  // Đóng modal khi nhấn Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu')
      return
    }
    setLoading(true)
    setError('')
    try {
      await userAPI.verifyPassword({ password })   // <-- gọi API xác thực
      toast.success('Xác thực thành công!')
      onSuccess?.()
    } catch (err) {
      const msg = err.response?.data?.message || 'Mật khẩu không đúng'
      setError(msg)
      setPassword('')
      inputRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel?.() }}
    >
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-rose-500 px-6 py-5 text-white text-center">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <i className="fa-solid fa-shield-halved text-2xl"></i>
          </div>
          <h2 className="text-lg font-bold">Xác thực danh tính</h2>
          <p className="text-sm text-white/80 mt-1">Nhập mật khẩu để truy cập tài khoản</p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <i className="fa-solid fa-lock text-sm"></i>
              </span>
              <input
                ref={inputRef}
                type={showPw ? 'text' : 'password'}
                className={`input pl-9 pr-10 ${error ? 'border-red-400 focus:ring-red-300' : ''}`}
                placeholder="Nhập mật khẩu của bạn"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                onClick={() => setShowPw(!showPw)}
                tabIndex={-1}
              >
                <i className={`fa-solid ${showPw ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
              </button>
            </div>

            {/* Error message */}
            {error && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <i className="fa-solid fa-circle-exclamation"></i>
                {error}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2 text-sm"
            >
              {loading
                ? <><i className="fa-solid fa-spinner fa-spin"></i> Đang kiểm tra...</>
                : <><i className="fa-solid fa-arrow-right-to-bracket"></i> Xác nhận</>
              }
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
