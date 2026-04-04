import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { orderAPI } from '../../services/api'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  PENDING:          { label:'Chờ xử lý',      color:'bg-gray-100 text-gray-600',    icon:'fa-clock',          next:['AWAITING_PAYMENT','CANCELLED'] },
  AWAITING_PAYMENT: { label:'Chờ thanh toán', color:'bg-yellow-100 text-yellow-700',icon:'fa-credit-card',    next:['PAID','CANCELLED'] },
  PAID:             { label:'Đã thanh toán',   color:'bg-blue-100 text-blue-700',    icon:'fa-circle-check',   next:['PROCESSING','REFUNDED'] },
  PROCESSING:       { label:'Đang xử lý',      color:'bg-purple-100 text-purple-700',icon:'fa-gear fa-spin',   next:['SHIPPED','CANCELLED'] },
  SHIPPED:          { label:'Đang giao',        color:'bg-orange-100 text-orange-700',icon:'fa-truck',          next:['DELIVERED'] },
  DELIVERED:        { label:'Đã giao',          color:'bg-green-100 text-green-700',  icon:'fa-box-open',       next:['REFUNDED'] },
  CANCELLED:        { label:'Đã huỷ',           color:'bg-red-100 text-red-600',      icon:'fa-ban',            next:[] },
  REFUNDED:         { label:'Đã hoàn tiền',     color:'bg-gray-100 text-gray-600',    icon:'fa-rotate-left',    next:[] },
}

export default function OrdersAdminPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState(null)
  const [updating, setUpdating] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, filterStatus],
    queryFn: () => orderAPI.getAllOrders({ page, size: 15, status: filterStatus || undefined }).then(r => r.data),
    refetchInterval: 30000,
  })

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p) + 'đ'
  const formatDate  = (d) => new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })

  const handleUpdateStatus = async (id, status) => {
    setUpdating(true)
    try {
      await orderAPI.updateStatus(id, status)
      toast.success('Cập nhật trạng thái thành công!')
      queryClient.invalidateQueries(['admin-orders'])
      setSelected(null)
    } catch { toast.error('Không thể cập nhật trạng thái') }
    finally { setUpdating(false) }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-bag-shopping text-red-500"></i>Quản lý đơn hàng
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{data?.totalElements || 0} đơn hàng</p>
        </div>
        <select className="input w-52" value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(0) }}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Mã đơn', 'Khách hàng', 'Thời gian', 'Tổng tiền', 'Thanh toán', 'Trạng thái', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-full"></div></td>
                    ))}
                  </tr>
                ))
              ) : data?.content?.map(order => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-mono font-bold text-gray-700">{order.orderCode}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800">{order.userName}</p>
                      <p className="text-xs text-gray-400">{order.shippingPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-red-500">{formatPrice(order.finalAmount)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {order.payment?.gateway || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap flex items-center gap-1 w-fit ${cfg.color}`}>
                        <i className={`fa-solid ${cfg.icon} text-xs`}></i>{cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(order)}
                        className="text-xs font-medium text-blue-500 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap flex items-center gap-1">
                        <i className="fa-solid fa-pen-to-square"></i>Cập nhật
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {data?.totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-50">
            <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page===0}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50">
              <i className="fa-solid fa-chevron-left text-xs"></i>
            </button>
            {[...Array(data.totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className={`w-8 h-8 rounded-lg text-sm font-medium ${page===i ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {i+1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(data.totalPages-1, p+1))} disabled={page===data.totalPages-1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50">
              <i className="fa-solid fa-chevron-right text-xs"></i>
            </button>
          </div>
        )}
      </div>

      {/* Update status modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-800">Cập nhật trạng thái</h2>
                <p className="text-sm text-gray-400 font-mono mt-0.5">{selected.orderCode}</p>
              </div>
              <button onClick={() => setSelected(null)}
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Order info */}
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Khách hàng</span>
                <span className="font-medium">{selected.userName}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Tổng tiền</span>
                <span className="font-bold text-red-500">
                  {new Intl.NumberFormat('vi-VN').format(selected.finalAmount)}đ
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Trạng thái hiện tại</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CONFIG[selected.status]?.color}`}>
                  {STATUS_CONFIG[selected.status]?.label}
                </span>
              </div>
            </div>

            <div className="p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Chuyển sang trạng thái:</p>
              <div className="space-y-2">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button key={key}
                    disabled={key === selected.status || updating}
                    onClick={() => handleUpdateStatus(selected.id, key)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      key === selected.status
                        ? 'border-2 border-red-300 bg-red-50 text-red-600 cursor-default'
                        : 'border border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}>
                    <i className={`fa-solid ${cfg.icon} w-4`}></i>
                    {cfg.label}
                    {key === selected.status && <i className="fa-solid fa-check ml-auto text-red-500"></i>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}