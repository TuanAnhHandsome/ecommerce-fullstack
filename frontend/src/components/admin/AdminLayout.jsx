import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { adminAPI, warrantyAPI } from '../../services/api'

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { to: '/admin', label: 'Dashboard', icon: 'fa-gauge', end: true },
    ]
  },
  {
    label: 'Kinh doanh',
    items: [
      { to: '/admin/products',  label: 'Sản phẩm',   icon: 'fa-box' },
      { to: '/admin/orders',    label: 'Đơn hàng',   icon: 'fa-bag-shopping', badge: 'orders' },
      { to: '/admin/users',     label: 'Người dùng', icon: 'fa-users' },
    ]
  },
  {
    label: 'Vận hành',
    items: [
      { to: '/admin/inventory',  label: 'Kho hàng',   icon: 'fa-warehouse', badge: 'inventory' },
      { to: '/admin/promotions', label: 'Khuyến mãi', icon: 'fa-ticket',    badge: 'promotions' },
      { to: '/admin/warranty',   label: 'Bảo hành',   icon: 'fa-shield-halved', badge: 'warranty' },
    ]
  },
  {
    label: 'Hệ thống',
    items: [
      { to: '/admin/settings', label: 'Cài đặt', icon: 'fa-gear', soon: true },
    ]
  },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [searchVal, setSearchVal] = useState('')

  const { data: stats } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  () => adminAPI.getDashboard().then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: pendingWarranty = 0 } = useQuery({
    queryKey: ['admin-warranty-badge'],
    queryFn:  () => warrantyAPI.adminList({ page: 0, size: 1, status: 'PENDING' })
      .then(r => r.data?.totalElements ?? 0),
    refetchInterval: 60000,
  })

  const getBadge = (key) => {
    if (key === 'orders')   return stats?.pendingOrders ?? 0
    if (key === 'warranty') return pendingWarranty
    return 0
  }

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">

      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-white border-r border-gray-100
        flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out`}>

        {/* Logo */}
        <div className={`h-16 border-b border-gray-100 flex items-center
          ${collapsed ? 'justify-center px-2' : 'gap-3 px-5'}`}>
          <div className="relative w-8 h-8 flex-shrink-0">
            <div className="w-full h-full bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-bold text-gray-900 text-sm leading-tight">EShop Admin</p>
              <p className="text-[11px] text-gray-400 truncate">{user?.fullName || 'Quản trị viên'}</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
              {group.label && !collapsed && (
                <p className="px-4 pb-1 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                  {group.label}
                </p>
              )}
              {group.label && collapsed && <div className="mx-auto w-6 border-t border-gray-100 my-2" />}

              <div className="px-2 space-y-0.5">
                {group.items.map(item =>
                  item.soon ? (
                    <div key={item.to} title={collapsed ? item.label : ''}
                      className={`flex items-center gap-3 rounded-xl text-sm px-3 py-2.5
                        text-gray-300 cursor-not-allowed select-none ${collapsed ? 'justify-center' : ''}`}>
                      <i className={`fa-solid ${item.icon} w-4 text-gray-200`}></i>
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full font-medium">Soon</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <NavLink key={item.to} to={item.to} end={item.end}
                      title={collapsed ? item.label : ''}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl text-sm font-medium px-3 py-2.5
                        transition-all relative ${collapsed ? 'justify-center' : ''}
                        ${isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`
                      }>
                      {({ isActive }) => {
                        const count = item.badge ? getBadge(item.badge) : 0
                        return (
                          <>
                            <i className={`fa-solid ${item.icon} w-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}></i>
                            {!collapsed && (
                              <>
                                <span className="flex-1">{item.label}</span>
                                {count > 0 && (
                                  <span className="bg-rose-500 text-white text-[10px] font-bold
                                    min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                                    {count > 9 ? '9+' : count}
                                  </span>
                                )}
                              </>
                            )}
                            {collapsed && count > 0 && (
                              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
                            )}
                          </>
                        )
                      }}
                    </NavLink>
                  )
                )}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-gray-100 space-y-0.5">
          <button onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Mở rộng' : 'Thu gọn'}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
              text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
            <i className={`fa-solid ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'} w-4`}></i>
            {!collapsed && <span>Thu gọn</span>}
          </button>
          <NavLink to="/" title={collapsed ? 'Xem cửa hàng' : ''}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400
              hover:bg-gray-50 hover:text-gray-700 transition-colors">
            <i className="fa-solid fa-store w-4"></i>
            {!collapsed && <span>Xem cửa hàng</span>}
          </NavLink>
          <button onClick={handleLogout} title={collapsed ? 'Đăng xuất' : ''}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
              text-rose-400 hover:bg-rose-50 transition-colors">
            <i className="fa-solid fa-right-from-bracket w-4"></i>
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto min-h-screen flex flex-col">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center
          justify-between px-6 sticky top-0 z-20 flex-shrink-0">
          <div className="relative w-80">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2
              text-gray-400 text-sm pointer-events-none"></i>
            <input type="text" value={searchVal} onChange={e => setSearchVal(e.target.value)}
              placeholder="Tìm mã đơn hàng, tên sản phẩm..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl
                text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-200
                focus:border-indigo-300 transition" />
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2.5 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors">
              <i className="fa-solid fa-bell text-sm"></i>
              {(getBadge('orders') > 0 || getBadge('warranty') > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            <div className="w-px h-6 bg-gray-100 mx-1"></div>
            <div className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl hover:bg-gray-50 cursor-pointer">
              <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-user-tie text-indigo-600 text-xs"></i>
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-gray-700 leading-tight">
                  {user?.fullName?.split(' ').slice(-1)[0] || 'Admin'}
                </p>
                <p className="text-[10px] text-gray-400 leading-tight">Quản trị viên</p>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1"><Outlet /></div>
      </main>
    </div>
  )
}