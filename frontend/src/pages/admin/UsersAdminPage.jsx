import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function UsersAdminPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, keyword],
    queryFn: () => adminAPI.getUsers({ page, size: 15, keyword: keyword || undefined }).then(r => r.data),
  })

  const formatDate = (d) => new Date(d).toLocaleDateString('vi-VN')

  const handleToggle = async (id, currentStatus, name) => {
    const action = currentStatus ? 'khoá' : 'mở khoá'
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản của "${name}"?`)) return
    try {
      await adminAPI.toggleUser(id)
      toast.success(`Đã ${action} tài khoản thành công!`)
      queryClient.invalidateQueries(['admin-users'])
    } catch { toast.error('Không thể cập nhật tài khoản') }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-users text-red-500"></i>Quản lý người dùng
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{data?.totalElements || 0} tài khoản</p>
        </div>
        <div className="relative">
          <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input className="input pl-9 w-64" placeholder="Tìm theo tên, email..."
            value={keyword} onChange={e => { setKeyword(e.target.value); setPage(0) }} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Người dùng', 'Điện thoại', 'Ngày đăng ký', 'Vai trò', 'Trạng thái', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-200 rounded"></div></td>
                    ))}
                  </tr>
                ))
              ) : data?.content?.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        user.role === 'ADMIN' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        <span className={`font-bold text-sm ${user.role === 'ADMIN' ? 'text-red-600' : 'text-blue-600'}`}>
                          {user.fullName?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{user.fullName}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{user.phone || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit ${
                      user.role === 'ADMIN' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <i className={`fa-solid ${user.role === 'ADMIN' ? 'fa-shield-halved' : 'fa-user'}`}></i>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit ${
                      user.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <i className={`fa-solid ${user.enabled ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
                      {user.enabled ? 'Hoạt động' : 'Bị khoá'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.role !== 'ADMIN' && (
                      <button onClick={() => handleToggle(user.id, user.enabled, user.fullName)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                          user.enabled
                            ? 'text-red-500 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}>
                        <i className={`fa-solid ${user.enabled ? 'fa-lock' : 'fa-lock-open'}`}></i>
                        {user.enabled ? 'Khoá' : 'Mở khoá'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data?.totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-50">
            <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page===0}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-30">
              <i className="fa-solid fa-chevron-left text-xs"></i>
            </button>
            {[...Array(data.totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className={`w-8 h-8 rounded-lg text-sm font-medium ${page===i ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {i+1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(data.totalPages-1, p+1))} disabled={page===data.totalPages-1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-30">
              <i className="fa-solid fa-chevron-right text-xs"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}