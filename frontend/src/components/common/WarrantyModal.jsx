import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { warrantyAPI } from '../../services/api'

const WARRANTY_TYPES = [
  {
    value: 'WARRANTY',
    label: 'Bảo hành',
    icon: 'fa-shield-halved',
    desc: 'Sản phẩm lỗi trong thời hạn bảo hành',
    color: 'border-blue-300 bg-blue-50 text-blue-700',
    activeColor: 'border-blue-500 bg-blue-100 ring-2 ring-blue-300',
  },
  {
    value: 'REPAIR',
    label: 'Sửa chữa',
    icon: 'fa-screwdriver-wrench',
    desc: 'Sửa chữa ngoài bảo hành (có phí)',
    color: 'border-amber-300 bg-amber-50 text-amber-700',
    activeColor: 'border-amber-500 bg-amber-100 ring-2 ring-amber-300',
  },
  {
    value: 'EXCHANGE',
    label: 'Đổi hàng',
    icon: 'fa-arrow-right-arrow-left',
    desc: 'Đổi sản phẩm lỗi sang sản phẩm mới',
    color: 'border-purple-300 bg-purple-50 text-purple-700',
    activeColor: 'border-purple-500 bg-purple-100 ring-2 ring-purple-300',
  },
]

/**
 * WarrantyModal — tạo yêu cầu bảo hành từ OrderDetailPage.
 *
 * Props:
 *   order   — Order object { id, orderCode, orderItems, shippingName, shippingPhone }
 *   onClose — callback đóng modal
 */
export default function WarrantyModal({ order, onClose }) {
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()

  const [type, setType]             = useState('WARRANTY')
  const [productName, setProductName] = useState(
    // Pre-fill tên sản phẩm đầu tiên trong đơn
    order.orderItems?.[0]?.productName ?? ''
  )
  const [serialNumber, setSerialNumber] = useState('')
  const [description, setDescription]  = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      warrantyAPI.create({
        orderId:     order.id,       // backend verify DELIVERED + owner
        productName: productName.trim(),
        serialNumber: serialNumber.trim() || null,
        type,
        description: description.trim(),
      }),
    onSuccess: (res) => {
      toast.success(`Đã tạo yêu cầu ${res.data.requestCode}`)
      queryClient.invalidateQueries(['order', String(order.id)])
      onClose()
      // Chuyển sang trang tra cứu bảo hành
      navigate(`/warranty/${res.data.requestCode}`)
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Không thể tạo yêu cầu bảo hành')
    },
  })

  const canSubmit =
    type &&
    productName.trim() &&
    description.trim() &&
    !mutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center
                    bg-black/40 backdrop-blur-sm px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-auto">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 p-5 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center
                          justify-center flex-shrink-0">
            <i className="fa-solid fa-shield-halved text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-800">Yêu cầu bảo hành / sửa chữa</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Đơn hàng{' '}
              <span className="font-mono font-medium text-gray-600">
                #{order.orderCode}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center
                       justify-center text-gray-400 transition-colors flex-shrink-0"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div className="p-5 space-y-5">

          {/* Loại yêu cầu */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2.5 block">
              Loại yêu cầu <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {WARRANTY_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    type === t.value ? t.activeColor : t.color
                  }`}
                >
                  <i className={`fa-solid ${t.icon} text-base block mb-1`} />
                  <p className="text-xs font-semibold">{t.label}</p>
                </button>
              ))}
            </div>
            {type && (
              <p className="text-xs text-gray-400 mt-1.5">
                <i className="fa-solid fa-circle-info mr-1" />
                {WARRANTY_TYPES.find(t => t.value === type)?.desc}
              </p>
            )}
          </div>

          {/* Sản phẩm cần bảo hành — chọn từ order items */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">
              Sản phẩm cần {type === 'REPAIR' ? 'sửa chữa' : 'bảo hành'}{' '}
              <span className="text-red-500">*</span>
            </label>

            {/* Nếu order có nhiều item → cho chọn */}
            {order.orderItems?.length > 1 ? (
              <div className="space-y-2 mb-2">
                {order.orderItems.map((item, i) => (
                  <label
                    key={i}
                    className={`flex items-center gap-3 p-2.5 border rounded-xl
                                cursor-pointer transition-all ${
                      productName === item.productName
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="productName"
                      value={item.productName}
                      checked={productName === item.productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="accent-blue-500 flex-shrink-0"
                    />
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                      {item.productImg
                        ? <img
                            src={item.productImg}
                            className="w-full h-full object-cover"
                            crossOrigin="anonymous"
                          />
                        : <div className="w-full h-full flex items-center justify-center">
                            <i className="fa-solid fa-box text-gray-300 text-sm" />
                          </div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">
                        {item.productName}
                      </p>
                      {item.variantName && (
                        <p className="text-xs text-gray-400">{item.variantName}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              /* 1 item → hiển thị luôn, không cần chọn */
              <div className="flex items-center gap-2.5 p-2.5 bg-gray-50
                              rounded-xl border border-gray-200 mb-2">
                <div className="w-9 h-9 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
                  {order.orderItems?.[0]?.productImg
                    ? <img
                        src={order.orderItems[0].productImg}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                    : <div className="w-full h-full flex items-center justify-center">
                        <i className="fa-solid fa-box text-gray-300 text-sm" />
                      </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 line-clamp-1">
                    {order.orderItems?.[0]?.productName}
                  </p>
                  {order.orderItems?.[0]?.variantName && (
                    <p className="text-xs text-gray-400">
                      {order.orderItems[0].variantName}
                    </p>
                  )}
                </div>
                <i className="fa-solid fa-circle-check text-green-500 flex-shrink-0" />
              </div>
            )}

            {/* Input thủ công nếu muốn ghi rõ hơn */}
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Hoặc nhập tên sản phẩm cụ thể..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-200
                         focus:border-blue-300 transition-all placeholder:text-gray-300"
            />
          </div>

          {/* Serial number */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
              Số serial / IMEI{' '}
              <span className="text-gray-400 font-normal">(nếu có)</span>
            </label>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="VD: SN123456789 hoặc IMEI"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                         font-mono focus:outline-none focus:ring-2 focus:ring-blue-200
                         focus:border-blue-300 transition-all placeholder:text-gray-300
                         placeholder:font-sans"
            />
          </div>

          {/* Mô tả vấn đề */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
              Mô tả vấn đề <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Mô tả chi tiết lỗi, thời điểm xảy ra, các bước tái hiện lỗi..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-200
                         focus:border-blue-300 resize-none transition-all
                         placeholder:text-gray-300"
            />
            <p className="text-right text-xs text-gray-300 mt-0.5">
              {description.length}/1000
            </p>
          </div>

          {/* Thông tin liên hệ pre-filled từ đơn hàng */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 mb-2">
              <i className="fa-solid fa-circle-info mr-1.5 text-blue-400" />
              Thông tin liên hệ (lấy từ đơn hàng)
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <i className="fa-solid fa-user w-3.5 text-gray-400" />
              {order.shippingName}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <i className="fa-solid fa-phone w-3.5 text-gray-400" />
              {order.shippingPhone}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <i className="fa-solid fa-map-pin w-3.5 text-gray-400" />
              <span className="line-clamp-1">{order.shippingAddress}</span>
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="flex gap-2.5 p-5 pt-0">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5
                       text-sm font-medium hover:bg-gray-50 transition-colors
                       disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={!canSubmit}
            className="flex-[2] bg-blue-500 text-white rounded-xl py-2.5 text-sm
                       font-medium hover:bg-blue-600 disabled:opacity-50
                       disabled:cursor-not-allowed transition-colors
                       flex items-center justify-center gap-2"
          >
            {mutation.isPending
              ? <><i className="fa-solid fa-spinner fa-spin" />Đang gửi...</>
              : <><i className="fa-solid fa-shield-halved" />Gửi yêu cầu</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
