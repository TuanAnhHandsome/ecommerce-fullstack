import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'
import SearchBar from './SearchBar'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, logout, isAdmin } = useAuthStore()
  const { totalItems, fetchCart } = useCartStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userDropdown, setUserDropdown] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (isAuthenticated) fetchCart()
  }, [isAuthenticated])

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location])

  const handleLogout = () => {
    logout()
    setUserDropdown(false)
    navigate('/')
  }

  // ── Kiểm tra route hiện tại ──
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  // ── Class động cho nav link desktop ──
  const navLinkClass = (path) =>
    `relative text-sm font-medium px-3 py-2 rounded-lg overflow-hidden
     flex items-center gap-1.5 transition-colors duration-150
     ${isActive(path)
       ? 'text-red-500 bg-red-50'
       : 'text-gray-600 hover:text-red-500 hover:bg-red-50'
     }`

  // ── Class động cho nav link mobile ──
  const mobileNavClass = (path) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150
     ${isActive(path)
       ? 'text-red-500 bg-red-50 font-medium'
       : 'text-gray-700 hover:bg-gray-50'
     }`

  // ── Ripple effect khi click ──
  const handleRipple = (e) => {
    const el = e.currentTarget
    const ripple = document.createElement('span')
    const rect = el.getBoundingClientRect()
    Object.assign(ripple.style, {
      position: 'absolute',
      borderRadius: '50%',
      pointerEvents: 'none',
      width: '120px',
      height: '120px',
      marginLeft: '-60px',
      marginTop: '-60px',
      left: `${e.clientX - rect.left}px`,
      top: `${e.clientY - rect.top}px`,
      background: 'rgba(239, 68, 68, 0.15)',
      transform: 'scale(0)',
      animation: 'navRipple 0.45s ease-out forwards',
    })
    el.appendChild(ripple)
    setTimeout(() => ripple.remove(), 450)
  }

  return (
    <>
      {/* Keyframe cho ripple — chỉ inject 1 lần */}
      <style>{`
        @keyframes navRipple {
          to { transform: scale(3); opacity: 0; }
        }
      `}</style>

      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm group-hover:border-red-200 transition-all">
                <img
                  src="/logo.jpg"
                  alt="EShop Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.parentNode.innerHTML = '<i class="fa-solid fa-store text-red-500"></i>'
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-gray-900 hidden sm:block leading-none">
                  E<span className="text-red-500">Shop</span>
                </span>
              </div>
            </Link>

            {/* SearchBar desktop */}
            <div className="hidden md:flex flex-1">
              <SearchBar />
            </div>

            {/* Nav links desktop */}
            <div className="hidden md:flex items-center gap-1 flex-shrink-0">
              <Link
                to="/"
                className={navLinkClass('/')}
                onClick={handleRipple}
              >
                <i className="fa-solid fa-house"></i>
                Trang chủ
                {isActive('/') && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-red-500 rounded-t-full" />
                )}
              </Link>

              <Link
                to="/products"
                className={navLinkClass('/products')}
                onClick={handleRipple}
              >
                <i className="fa-solid fa-shop"></i>
                Sản phẩm
                {isActive('/products') && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-red-500 rounded-t-full" />
                )}
              </Link>

              {isAuthenticated && isAdmin() && (
                <Link
                  to="/admin"
                  className={navLinkClass('/admin')}
                  onClick={handleRipple}
                >
                  <i className="fa-solid fa-gauge"></i>
                  Admin
                  {isActive('/admin') && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-red-500 rounded-t-full" />
                  )}
                </Link>
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isAuthenticated && (
                <Link
                  to="/cart"
                  className={`relative p-2 rounded-lg transition-colors
                    ${isActive('/cart')
                      ? 'text-red-500 bg-red-50'
                      : 'text-gray-600 hover:text-red-500 hover:bg-red-50'
                    }`}
                  onClick={handleRipple}
                >
                  <i className={`fa-solid fa-cart-shopping text-xl transition-transform duration-200
                    ${isActive('/cart') ? 'scale-110' : ''}`}
                  ></i>
                  {totalItems > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {totalItems > 9 ? '9+' : totalItems}
                    </span>
                  )}
                </Link>
              )}

              {isAuthenticated ? (
                <div className="relative hidden md:block" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdown(!userDropdown)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-bold text-xs">
                        {user?.fullName?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700 font-medium max-w-[100px] truncate">
                      {user?.fullName}
                    </span>
                    <i className={`fa-solid fa-chevron-down text-xs text-gray-400 transition-transform ${userDropdown ? 'rotate-180' : ''}`}></i>
                  </button>

                  {userDropdown && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-50">
                        <p className="text-xs font-semibold text-gray-800 truncate">{user?.fullName}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                      </div>
                      <Link
                        to="/orders"
                        onClick={() => setUserDropdown(false)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors
                          ${isActive('/orders')
                            ? 'text-red-500 bg-red-50'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-red-500'
                          }`}
                      >
                        <i className="fa-solid fa-box w-4"></i>Đơn hàng của tôi
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdown(false)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors
                          ${isActive('/profile')
                            ? 'text-red-500 bg-red-50'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-red-500'
                          }`}
                      >
                        <i className="fa-solid fa-circle-user w-4"></i>Tài khoản
                      </Link>
                      {isAdmin() && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdown(false)}
                          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors
                            ${isActive('/admin')
                              ? 'text-red-500 bg-red-50'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-red-500'
                            }`}
                        >
                          <i className="fa-solid fa-gauge w-4"></i>Quản trị
                        </Link>
                      )}
                      <div className="border-t border-gray-50 mt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <i className="fa-solid fa-right-from-bracket w-4"></i>Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/login" className="text-sm text-gray-600 hover:text-red-500 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="btn-primary text-sm py-2 px-4">Đăng ký</Link>
                </div>
              )}

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-red-500 rounded-lg hover:bg-gray-50"
              >
                <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
              </button>
            </div>
          </div>

          {/* SearchBar mobile */}
          <div className="md:hidden pb-3">
            <SearchBar />
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-3 space-y-1">
              <Link
                to="/"
                className={mobileNavClass('/')}
                onClick={handleRipple}
              >
                <i className={`fa-solid fa-house w-4 ${isActive('/') ? 'text-red-400' : 'text-gray-400'}`}></i>
                Trang chủ
                {isActive('/') && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500" />}
              </Link>

              <Link
                to="/products"
                className={mobileNavClass('/products')}
                onClick={handleRipple}
              >
                <i className={`fa-solid fa-shop w-4 ${isActive('/products') ? 'text-red-400' : 'text-gray-400'}`}></i>
                Sản phẩm
                {isActive('/products') && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500" />}
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    to="/orders"
                    className={mobileNavClass('/orders')}
                    onClick={handleRipple}
                  >
                    <i className={`fa-solid fa-box w-4 ${isActive('/orders') ? 'text-red-400' : 'text-gray-400'}`}></i>
                    Đơn hàng của tôi
                    {isActive('/orders') && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500" />}
                  </Link>

                  {isAdmin() && (
                    <Link
                      to="/admin"
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors
                        ${isActive('/admin') ? 'text-red-500 bg-red-50' : 'text-red-500 hover:bg-red-50'}`}
                      onClick={handleRipple}
                    >
                      <i className="fa-solid fa-gauge w-4"></i>
                      Quản trị Admin
                      {isActive('/admin') && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500" />}
                    </Link>
                  )}

                  <div className="border-t border-gray-100 pt-2 mt-2">
                    <div className="flex items-center gap-3 px-3 py-2 mb-1">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 font-bold text-sm">
                          {user?.fullName?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{user?.fullName}</p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50"
                    >
                      <i className="fa-solid fa-right-from-bracket w-4"></i>Đăng xuất
                    </button>
                  </div>
                </>
              )}

              {!isAuthenticated && (
                <div className="border-t border-gray-100 pt-2 mt-2 flex gap-2">
                  <Link to="/login" className="flex-1 btn-secondary text-center text-sm py-2">Đăng nhập</Link>
                  <Link to="/register" className="flex-1 btn-primary text-center text-sm py-2">Đăng ký</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  )
}