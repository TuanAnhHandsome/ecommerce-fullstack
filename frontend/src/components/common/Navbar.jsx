import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'

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

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-bolt text-white text-sm"></i>
            </div>
            <span className="font-bold text-lg text-gray-900">EShop</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm text-gray-600 hover:text-red-500 transition-colors font-medium">
              <i className="fa-solid fa-house mr-1.5"></i>Trang chủ
            </Link>
            <Link to="/products" className="text-sm text-gray-600 hover:text-red-500 transition-colors font-medium">
              <i className="fa-solid fa-shop mr-1.5"></i>Sản phẩm
            </Link>
            {isAuthenticated && isAdmin() && (
              <Link to="/admin" className="text-sm text-red-500 font-semibold hover:text-red-600">
                <i className="fa-solid fa-gauge mr-1.5"></i>Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Link to="/cart" className="relative p-2 text-gray-600 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                <i className="fa-solid fa-cart-shopping text-xl"></i>
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated ? (
              <div className="relative hidden md:block" ref={dropdownRef}>
                <button onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold text-xs">{user?.fullName?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <span className="text-sm text-gray-700 font-medium max-w-[100px] truncate">{user?.fullName}</span>
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
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-red-500 transition-colors"
                    >
                      <i className="fa-solid fa-box w-4"></i>
                      Đơn hàng của tôi
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-red-500 transition-colors"
                    >
                      <i className="fa-solid fa-circle-user w-4"></i>
                      Tài khoản
                    </Link>
                    {isAdmin() && (
                      <Link to="/admin" onClick={() => setUserDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-red-500 transition-colors">
                        <i className="fa-solid fa-gauge w-4"></i>Quản trị
                      </Link>
                    )}
                    <div className="border-t border-gray-50 mt-1">
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
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

            <button onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-red-500 rounded-lg hover:bg-gray-50">
              <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-1">
            <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              <i className="fa-solid fa-house w-4 text-gray-400"></i>Trang chủ
            </Link>
            <Link to="/products" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              <i className="fa-solid fa-shop w-4 text-gray-400"></i>Sản phẩm
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/orders" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  <i className="fa-solid fa-box w-4 text-gray-400"></i>Đơn hàng của tôi
                </Link>
                {isAdmin() && (
                  <Link to="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 font-semibold hover:bg-red-50">
                    <i className="fa-solid fa-gauge w-4"></i>Quản trị Admin
                  </Link>
                )}
                <div className="border-t border-gray-100 pt-2 mt-2">
                  <div className="flex items-center gap-3 px-3 py-2 mb-1">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-bold text-sm">{user?.fullName?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{user?.fullName}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                  </div>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50">
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
  )
}