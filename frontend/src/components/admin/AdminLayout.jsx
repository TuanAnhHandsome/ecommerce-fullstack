import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { adminAPI, warrantyAPI, returnAPI } from '../../services/api'

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
      { to: '/admin/inventory',  label: 'Kho hàng',   icon: 'fa-warehouse',     badge: 'inventory'  },
      { to: '/admin/promotions', label: 'Khuyến mãi', icon: 'fa-ticket',        badge: 'promotions' },
      { to: '/admin/returns',    label: 'Hoàn hàng',  icon: 'fa-rotate-left',   badge: 'returns'    },
      { to: '/admin/warranty',   label: 'Bảo hành',   icon: 'fa-shield-halved', badge: 'warranty'   },
    ]
  },
  {
    label: 'Hệ thống',
    items: [
      { to: '/admin/settings', label: 'Cài đặt', icon: 'fa-gear' }, // ← bỏ soon
    ]
  },
]

// ── Notification Panel ────────────────────────────────────────────────────────
function NotificationPanel({ stats, pendingWarranty, pendingReturns, onClose, navigate }) {
  const ref = useRef()

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const pendingOrders = stats?.pendingOrders ?? 0
  const lowStock      = stats?.lowStockProducts?.length ?? 0

  const items = [
    {
      show:      pendingOrders > 0,
      icon:      'fa-bag-shopping',
      color:     'bg-amber-100 text-amber-600',
      title:     `${pendingOrders} đơn hàng chờ xác nhận`,
      desc:      'Cần xử lý để không ảnh hưởng trải nghiệm khách',
      link:      '/admin/orders',
    },
    {
      show:      pendingReturns > 0,
      icon:      'fa-rotate-left',
      color:     'bg-orange-100 text-orange-600',
      title:     `${pendingReturns} yêu cầu hoàn hàng chờ duyệt`,
      desc:      'Khách đang chờ phản hồi từ cửa hàng',
      link:      '/admin/returns',
    },
    {
      show:      pendingWarranty > 0,
      icon:      'fa-shield-halved',
      color:     'bg-blue-100 text-blue-600',
      title:     `${pendingWarranty} yêu cầu bảo hành chờ tiếp nhận`,
      desc:      'Yêu cầu bảo hành / sửa chữa mới chưa xử lý',
      link:      '/admin/warranty',
    },
    {
      show:      lowStock > 0,
      icon:      'fa-triangle-exclamation',
      color:     'bg-rose-100 text-rose-600',
      title:     `${lowStock} sản phẩm tồn kho thấp hoặc hết hàng`,
      desc:      'Cần nhập hàng để tránh mất doanh thu',
      link:      '/admin/inventory',
    },
  ].filter(i => i.show)

  const total = pendingOrders + pendingReturns + pendingWarranty + (lowStock > 0 ? 1 : 0)

  return (
    <div ref={ref}
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl
        shadow-xl border border-gray-100 z-50 overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-gray-800">Thông báo</span>
          {total > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-bold
              min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
              {total > 9 ? '9+' : total}
            </span>
          )}
        </div>
        <button onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[360px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-2">
            <i className="fa-solid fa-circle-check text-3xl text-emerald-400"></i>
            <p className="text-sm text-emerald-600 font-semibold">Mọi thứ ổn!</p>
            <p className="text-xs text-gray-400">Không có thông báo mới</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {items.map((item, i) => (
              <button key={i}
                onClick={() => { navigate(item.link); onClose() }}
                className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50
                  transition-colors text-left group">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                  flex-shrink-0 ${item.color}`}>
                  <i className={`fa-solid ${item.icon} text-sm`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 leading-snug
                    group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{item.desc}</p>
                </div>
                <i className="fa-solid fa-chevron-right text-xs text-gray-300
                  group-hover:text-indigo-400 transition-colors mt-1 flex-shrink-0"></i>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/60">
          <p className="text-[11px] text-gray-400 text-center">
            Cập nhật tự động · Nhấn để xử lý
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main Layout ───────────────────────────────────────────────────────────────
export default function AdminLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [showNotif, setShowNotif] = useState(false)

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

  const { data: pendingReturns = 0 } = useQuery({
    queryKey: ['admin-returns-badge'],
    queryFn:  () => returnAPI.adminList({ page: 0, size: 1, status: 'PENDING' })
      .then(r => r.data?.totalElements ?? 0),
    refetchInterval: 60000,
  })

  const getBadge = (key) => {
    if (key === 'orders')   return stats?.pendingOrders  ?? 0
    if (key === 'warranty') return pendingWarranty
    if (key === 'returns')  return pendingReturns
    return 0
  }

  const totalNotif = (stats?.pendingOrders ?? 0)
    + pendingWarranty
    + pendingReturns
    + (stats?.lowStockProducts?.length > 0 ? 1 : 0)

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
            <div className="w-full h-full bg-white rounded-lg overflow-hidden
              border border-gray-200 shadow-sm">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500
              border-2 border-white rounded-full"></span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-bold text-gray-900 text-sm leading-tight">EShop Admin</p>
              <p className="text-[11px] text-gray-400 truncate">
                {user?.fullName || 'Quản trị viên'}
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
              {group.label && !collapsed && (
                <p className="px-4 pb-1 text-[10px] font-bold text-gray-300
                  uppercase tracking-widest">
                  {group.label}
                </p>
              )}
              {group.label && collapsed && (
                <div className="mx-auto w-6 border-t border-gray-100 my-2" />
              )}

              <div className="px-2 space-y-0.5">
                {group.items.map(item => (
                  <NavLink key={item.to} to={item.to} end={item.end}
                    title={collapsed ? item.label : ''}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl text-sm font-medium px-3 py-2.5
                      transition-all relative ${collapsed ? 'justify-center' : ''}
                      ${isActive
                        ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`
                    }>
                    {({ isActive }) => {
                      const count = item.badge ? getBadge(item.badge) : 0
                      return (
                        <>
                          <i className={`fa-solid ${item.icon} w-4
                            ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}></i>
                          {!collapsed && (
                            <>
                              <span className="flex-1">{item.label}</span>
                              {count > 0 && (
                                <span className="bg-rose-500 text-white text-[10px] font-bold
                                  min-w-[18px] h-[18px] px-1 rounded-full
                                  flex items-center justify-center">
                                  {count > 9 ? '9+' : count}
                                </span>
                              )}
                            </>
                          )}
                          {collapsed && count > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2
                              bg-rose-500 rounded-full"></span>
                          )}
                        </>
                      )
                    }}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-gray-100 space-y-0.5">
          <button onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Mở rộng' : 'Thu gọn'}
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

          {/* Search */}
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

            {/* Bell + dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotif(v => !v)}
                className="relative p-2.5 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors">
                <i className="fa-solid fa-bell text-sm"></i>
                {totalNotif > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5
                    bg-rose-500 rounded-full border-2 border-white flex items-center
                    justify-center text-[9px] font-bold text-white leading-none">
                    {totalNotif > 9 ? '9+' : totalNotif}
                  </span>
                )}
              </button>

              {showNotif && (
                <NotificationPanel
                  stats={stats}
                  pendingWarranty={pendingWarranty}
                  pendingReturns={pendingReturns}
                  onClose={() => setShowNotif(false)}
                  navigate={navigate}
                />
              )}
            </div>

            <div className="w-px h-6 bg-gray-100 mx-1"></div>

            {/* User — click vào đi settings */}
            <NavLink to="/admin/settings"
              className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl
                hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-user-tie text-indigo-600 text-xs"></i>
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-gray-700 leading-tight">
                  {user?.fullName?.split(' ').slice(-1)[0] || 'Admin'}
                </p>
                <p className="text-[10px] text-gray-400 leading-tight">Quản trị viên</p>
              </div>
            </NavLink>
          </div>
        </header>

        <div className="flex-1"><Outlet /></div>
      </main>
    </div>
  )
}