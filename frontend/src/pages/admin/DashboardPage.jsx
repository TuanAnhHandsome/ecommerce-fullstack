import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { adminAPI } from '../../services/api'

// 👉 ICONS
import {
  FaDollarSign,
  FaShoppingBag,
  FaHourglassHalf,
  FaUsers,
  FaArrowUp,
  FaArrowDown,
  FaClock,
  FaCalendar,
  FaChartLine,
  FaBox,
  FaTag
} from "react-icons/fa"

// 👉 Stat Card
function StatCard({ title, value, sub, icon, color, trend }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>

        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${
            trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          }`}>
            {trend >= 0 ? <FaArrowUp /> : <FaArrowDown />}
          </span>
        )}
      </div>

      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-600">{title}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => adminAPI.getDashboard().then(r => r.data),
    refetchInterval: 30000,
  })

  const formatPrice = (p) => {
    if (!p) return '0đ'
    if (p >= 1_000_000_000) return (p / 1_000_000_000).toFixed(1) + 'B'
    if (p >= 1_000_000) return (p / 1_000_000).toFixed(1) + 'M'
    if (p >= 1_000) return (p / 1_000).toFixed(0) + 'K'
    return p + 'đ'
  }

  const chartData = stats?.revenueByDay?.map(d => ({
    date: d.date?.slice(5),
    revenue: Number(d.revenue) / 1000,
    orders: Number(d.orders),
  })) || []

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

          <p className="text-sm text-gray-400 flex items-center gap-1">
            <FaClock />
            Cập nhật mỗi 30 giây
          </p>
        </div>

        <div className="text-sm text-gray-400 flex items-center gap-1">
          <FaCalendar />
          {new Date().toLocaleDateString('vi-VN', {
            weekday:'long',
            day:'2-digit',
            month:'long',
            year:'numeric'
          })}
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        <StatCard
          title="Tổng doanh thu"
          value={formatPrice(stats?.totalRevenue)}
          sub="Đơn đã thanh toán"
          color="bg-green-100 text-green-600"
          icon={<FaDollarSign />}
        />

        <StatCard
          title="Đơn hôm nay"
          value={stats?.todayOrders || 0}
          sub={formatPrice(stats?.todayRevenue)}
          color="bg-blue-100 text-blue-600"
          icon={<FaShoppingBag />}
        />

        <StatCard
          title="Chờ thanh toán"
          value={stats?.pendingOrders || 0}
          sub="Cần xử lý"
          color="bg-yellow-100 text-yellow-600"
          icon={<FaHourglassHalf />}
        />

        <StatCard
          title="Người dùng"
          value={stats?.totalUsers || 0}
          sub={`${stats?.totalProducts || 0} sản phẩm`}
          color="bg-purple-100 text-purple-600"
          icon={<FaUsers />}
        />
      </div>

      {/* CHART */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border p-6 mb-6">

          <h2 className="font-bold text-gray-700 flex items-center gap-2 mb-2">
            <FaChartLine className="text-red-500" />
            Doanh thu 30 ngày qua
          </h2>

          <p className="text-xs text-gray-400 mb-4">
            Đơn vị: nghìn đồng (K)
          </p>

          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" />
              <YAxis />

              <Tooltip formatter={(v) => [v + 'K', 'Doanh thu']} />

              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#ef4444"
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* BOTTOM */}
      <div className="grid md:grid-cols-3 gap-4">

        {[
          {
            label: 'Tổng đơn hàng',
            value: stats?.totalOrders || 0,
            icon: <FaBox />,
            color: 'text-blue-500'
          },
          {
            label: 'Tổng sản phẩm',
            value: stats?.totalProducts || 0,
            icon: <FaTag />,
            color: 'text-purple-500'
          },
          {
            label: 'Doanh thu hôm nay',
            value: formatPrice(stats?.todayRevenue),
            icon: <FaDollarSign />,
            color: 'text-green-500'
          }
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-2xl border p-5 flex items-center gap-4">

            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
              <span className={item.color}>{item.icon}</span>
            </div>

            <div>
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="text-xl font-bold text-gray-800">{item.value}</p>
            </div>

          </div>
        ))}
      </div>

    </div>
  )
}