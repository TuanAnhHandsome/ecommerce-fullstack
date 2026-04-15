import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { adminAPI } from '../../services/api'
import {
  FaDollarSign, FaShoppingBag, FaHourglassHalf,
  FaUsers, FaArrowUp, FaArrowDown, FaClock,
  FaCalendar, FaChartLine, FaBox, FaTag,
  FaFire, FaExclamationTriangle, FaTrophy
} from 'react-icons/fa'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatPrice = (p) => {
  if (!p) return '0đ'
  if (p >= 1_000_000_000) return (p / 1_000_000_000).toFixed(1) + 'B'
  if (p >= 1_000_000)     return (p / 1_000_000).toFixed(1) + 'M'
  if (p >= 1_000)         return (p / 1_000).toFixed(0) + 'K'
  return p + 'đ'
}

const MEDAL_COLORS = ['text-amber-400', 'text-slate-400', 'text-orange-400']
const MEDAL_ICONS  = ['🥇', '🥈', '🥉']

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ title, value, sub, icon, colorClass, trend }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorClass}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1
            ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
            {trend >= 0 ? <FaArrowUp className="text-[10px]" /> : <FaArrowDown className="text-[10px]" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-800 tracking-tight">{value}</p>
      <p className="text-sm font-medium text-gray-500 mt-0.5">{title}</p>
      {sub && <p className="text-xs text-gray-350 mt-1">{sub}</p>}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value >= 1000 ? p.value.toLocaleString() + 'K' : p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  () => adminAPI.getDashboard().then(r => r.data),
    refetchInterval: 30000,
  })

  const revenueData = stats?.revenueByDay?.map(d => ({
    date:    d.date?.slice(5),
    revenue: Number(d.revenue) / 1000,
    orders:  Number(d.orders),
  })) || []

  return (
    <div className="p-7 space-y-6">

      {/* ── HEADER ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Tổng quan</h1>
          <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1.5">
            <FaClock className="text-xs" />
            Tự động cập nhật mỗi 30 giây
          </p>
        </div>
        <div className="text-sm text-gray-400 flex items-center gap-1.5 bg-white border
          border-gray-100 px-3 py-2 rounded-xl">
          <FaCalendar className="text-xs text-indigo-400" />
          {new Date().toLocaleDateString('vi-VN', {
            weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
          })}
        </div>
      </div>

      {/* ── STAT CARDS ───────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Tổng doanh thu"  value={formatPrice(stats?.totalRevenue)}
            sub="Đơn đã thanh toán"
            colorClass="bg-emerald-50 text-emerald-600"
            icon={<FaDollarSign />} />

          <StatCard title="Đơn hôm nay"     value={stats?.todayOrders || 0}
            sub={formatPrice(stats?.todayRevenue)}
            colorClass="bg-indigo-50 text-indigo-600"
            icon={<FaShoppingBag />} />

          <StatCard title="Chờ xác nhận"    value={stats?.pendingOrders || 0}
            sub="Cần xử lý ngay"
            colorClass="bg-amber-50 text-amber-600"
            icon={<FaHourglassHalf />} />

          <StatCard title="Người dùng"       value={stats?.totalUsers || 0}
            sub={`${stats?.totalProducts || 0} sản phẩm`}
            colorClass="bg-violet-50 text-violet-600"
            icon={<FaUsers />} />
        </div>
      )}

      {/* ── CHARTS ROW ───────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Area chart - Revenue 30 ngày */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <FaChartLine className="text-indigo-500" />
              Doanh thu 30 ngày qua
            </h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
              Đơn vị: nghìn đồng (K)
            </span>
          </div>

          {isLoading ? (
            <Skeleton className="h-52 mt-4" />
          ) : revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Doanh thu"
                  stroke="#6366f1" strokeWidth={2} fill="url(#gRevenue)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-300 text-sm mt-4">
              Chưa có dữ liệu
            </div>
          )}
        </div>

        {/* Bar chart - Đơn hàng theo ngày */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2 mb-1">
            <FaBox className="text-amber-500" />
            Đơn hàng / ngày
          </h2>
          <p className="text-xs text-gray-400 mb-3">7 ngày gần nhất</p>

          {isLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueData.slice(-7)} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="orders" name="Đơn hàng" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── BOTTOM ROW ───────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Top sản phẩm bán chạy */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <FaTrophy className="text-amber-500" />
            Top sản phẩm bán chạy
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : stats?.topSellingProducts?.length > 0 ? (
            <div className="space-y-2">
              {stats.topSellingProducts.map((p, idx) => (
                <div key={p.productId}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group">

                  {/* Rank */}
                  <span className="text-lg w-7 text-center flex-shrink-0">
                    {idx < 3 ? MEDAL_ICONS[idx] : (
                      <span className="text-sm font-bold text-gray-300">#{idx + 1}</span>
                    )}
                  </span>

                  {/* Ảnh */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.productName}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous" referrerPolicy="no-referrer" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <i className="fa-solid fa-image text-gray-300 text-xs"></i>
                        </div>
                    }
                  </div>

                  {/* Tên */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate group-hover:text-indigo-600 transition-colors">
                      {p.productName}
                    </p>
                    <p className="text-xs text-gray-400">
                      Doanh thu: <span className="text-emerald-600 font-semibold">
                        {formatPrice(p.totalRevenue)}
                      </span>
                    </p>
                  </div>

                  {/* Sold badge */}
                  <div className="flex-shrink-0 text-right">
                    <span className="text-sm font-bold text-gray-700">{p.totalSold}</span>
                    <p className="text-[10px] text-gray-400 leading-tight">đã bán</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-gray-300 gap-2">
              <FaFire className="text-2xl" />
              <p className="text-sm">Chưa có dữ liệu bán hàng</p>
            </div>
          )}
        </div>

        {/* Cảnh báo tồn kho thấp */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <FaExclamationTriangle className="text-rose-500" />
              Cảnh báo tồn kho thấp
            </h2>
            {stats?.lowStockProducts?.length > 0 && (
              <span className="text-xs bg-rose-50 text-rose-500 font-semibold px-2 py-1 rounded-full">
                {stats.lowStockProducts.length} sản phẩm
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : stats?.lowStockProducts?.length > 0 ? (
            <div className="space-y-2">
              {stats.lowStockProducts.map((p) => (
                <div key={p.productId}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">

                  {/* Ảnh */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.productName}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous" referrerPolicy="no-referrer" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <i className="fa-solid fa-image text-gray-300 text-xs"></i>
                        </div>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{p.productName}</p>
                    <p className="text-xs text-gray-400">SKU: {p.sku || '—'}</p>
                  </div>

                  {/* Stock badge */}
                  <div className="flex-shrink-0">
                    {p.stockQty === 0 ? (
                      <span className="text-xs font-bold bg-rose-100 text-rose-600
                        px-2.5 py-1 rounded-full flex items-center gap-1">
                        <i className="fa-solid fa-circle-xmark text-[10px]"></i>Hết hàng
                      </span>
                    ) : (
                      <span className="text-xs font-bold bg-amber-50 text-amber-600
                        px-2.5 py-1 rounded-full flex items-center gap-1">
                        <i className="fa-solid fa-triangle-exclamation text-[10px]"></i>
                        Còn {p.stockQty}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-gray-300 gap-2">
              <i className="fa-solid fa-circle-check text-2xl text-emerald-300"></i>
              <p className="text-sm text-emerald-500 font-medium">Kho hàng ổn định</p>
              <p className="text-xs text-gray-400">Tất cả sản phẩm đủ hàng</p>
            </div>
          )}
        </div>
      </div>

      {/* ── QUICK STATS FOOTER ───────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng đơn hàng',   value: stats?.totalOrders  || 0, icon: <FaBox />,        color: 'text-indigo-400' },
          { label: 'Tổng sản phẩm',   value: stats?.totalProducts || 0, icon: <FaTag />,        color: 'text-violet-400' },
          { label: 'Doanh thu hôm nay', value: formatPrice(stats?.todayRevenue), icon: <FaDollarSign />, color: 'text-emerald-400' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
            <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center">
              <span className={item.color}>{item.icon}</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 leading-tight">{item.label}</p>
              <p className="text-lg font-bold text-gray-800 leading-tight">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}