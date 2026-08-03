import { Link } from 'react-router-dom'

const STORAGE_KEY = 'eshop-settings'

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export default function Footer() {
  const s = loadSettings()

  return (
    <footer className="bg-gray-900 text-gray-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6 group">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden border-2 border-gray-800 group-hover:border-red-500 transition-all">
                <img
                  src={s.logoUrl || '/logo.jpg'}
                  alt="EShop Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-white font-extrabold text-xl tracking-tight">
                {s.name
                  ? s.name
                  : <>E<span className="text-red-500">Shop</span></>
                }
              </span>
            </Link>
            <p className="text-sm leading-relaxed">
              {s.tagline || 'Mua sắm trực tuyến uy tín, giao hàng nhanh toàn quốc.'}
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href={s.facebook || '#'}
                target={s.facebook ? '_blank' : undefined}
                rel="noreferrer"
                className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                <i className="fa-brands fa-facebook-f text-sm"></i>
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors">
                <i className="fa-brands fa-instagram text-sm"></i>
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors">
                <i className="fa-brands fa-youtube text-sm"></i>
              </a>
              {s.zalo && (
                <a
                  href={s.zalo.startsWith('http') ? s.zalo : `https://zalo.me/${s.zalo}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-500 transition-colors"
                  title="Zalo"
                >
                  <i className="fa-solid fa-comment-dots text-sm"></i>
                </a>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Mua sắm</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className="hover:text-white hover:pl-1 transition-all">
                <i className="fa-solid fa-chevron-right text-xs mr-1"></i>Tất cả sản phẩm
              </Link></li>
              <li><a href="#" className="hover:text-white hover:pl-1 transition-all">
                <i className="fa-solid fa-chevron-right text-xs mr-1"></i>Khuyến mãi
              </a></li>
              <li><a href="#" className="hover:text-white hover:pl-1 transition-all">
                <i className="fa-solid fa-chevron-right text-xs mr-1"></i>Hàng mới về
              </a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white hover:pl-1 transition-all">
                <i className="fa-solid fa-chevron-right text-xs mr-1"></i>Chính sách đổi trả
              </a></li>
              <li><a href="#" className="hover:text-white hover:pl-1 transition-all">
                <i className="fa-solid fa-chevron-right text-xs mr-1"></i>Hướng dẫn mua hàng
              </a></li>
              <li><a href="#" className="hover:text-white hover:pl-1 transition-all">
                <i className="fa-solid fa-chevron-right text-xs mr-1"></i>Chính sách bảo mật
              </a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Liên hệ</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <i className="fa-solid fa-phone text-red-400 w-4"></i>
                <span>{s.phone || '1900 xxxx'}</span>
              </li>
              <li className="flex items-center gap-2">
                <i className="fa-solid fa-envelope text-red-400 w-4"></i>
                {s.email
                  ? <a href={`mailto:${s.email}`} className="hover:text-white transition-colors">{s.email}</a>
                  : <span>support@eshop.vn</span>
                }
              </li>
              {s.website && (
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-globe text-red-400 w-4"></i>
                  <a href={s.website} target="_blank" rel="noreferrer"
                    className="hover:text-white transition-colors truncate">
                    {s.website.replace(/^https?:\/\//, '')}
                  </a>
                </li>
              )}
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-location-dot text-red-400 w-4 mt-0.5"></i>
                <span>
                  {[s.address, s.city].filter(Boolean).join(', ') || '123 Lê Lợi, Q1, TP.HCM'}
                </span>
              </li>
            </ul>

            <div className="mt-4">
              <p className="text-xs font-semibold text-white mb-2">Thanh toán</p>
              <div className="flex gap-2 flex-wrap">
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-bold">VNPay</span>
                <span className="bg-gray-700 text-white text-xs px-2 py-1 rounded">COD</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-sm">© 2026 TuanANH. Built with passion.</p>
          <p className="text-xs text-gray-600">
            Crafted by TuanAnh <i className="fa-solid fa-heart text-red-500 mx-1"></i>
          </p>
        </div>
      </div>
    </footer>
  )
}