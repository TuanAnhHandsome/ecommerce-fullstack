import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { adminAPI } from '../../services/api'

const navItems = [
  { to: '/admin',          label: 'Dashboard',    icon: 'fa-gauge',      end: true },
  { to: '/admin/products', label: 'Sản phẩm',     icon: 'fa-box' },
  { to: '/admin/orders',   label: 'Đơn hàng',     icon: 'fa-bag-shopping', badge: true },
  { to: '/admin/users',    label: 'Người dùng',   icon: 'fa-users' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const { data: stats } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => adminAPI.getDashboard().then(r => r.data),
    refetchInterval: 30000,
  })

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-bolt text-white"></i>
            </div>
            <div>
              <p className="font-bold text-gray-800">EShop Admin</p>
              <p className="text-xs text-gray-400 truncate max-w-[120px]">{user?.fullName}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-red-50 text-red-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`
              }>
              {({ isActive }) => (
                <>
                  <i className={`fa-solid ${item.icon} w-4 ${isActive ? 'text-red-500' : 'text-gray-400'}`}></i>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && stats?.pendingOrders > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {stats.pendingOrders > 9 ? '9+' : stats.pendingOrders}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <NavLink to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
            <i className="fa-solid fa-store w-4 text-gray-400"></i>Xem cửa hàng
          </NavLink>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors">
            <i className="fa-solid fa-right-from-bracket w-4"></i>Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}