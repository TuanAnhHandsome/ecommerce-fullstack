import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { returnAPI } from '../../services/api'

const RETURN_REASONS = [
  { value: 'WRONG_ITEM', label: 'Sai sản phẩm / màu / size', icon: 'fa-arrow-right-arrow-left' },
  { value: 'DEFECTIVE', label: 'Hàng lỗi / hư hỏng', icon: 'fa-triangle-exclamation' },
  { value: 'NOT_AS_DESCRIBED', label: 'Không đúng mô tả', icon: 'fa-circle-xmark' },
  { value: 'CHANGED_MIND', label: 'Đổi ý không muốn mua', icon: 'fa-rotate-left' },
  { value: 'MISSING_PARTS', label: 'Thiếu phụ kiện / linh kiện', icon: 'fa-box-open' },
  { value: 'OTHER', label: 'Lý do khác', icon: 'fa-ellipsis' },
]

const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p) + 'đ'

/**
 * ReturnModal — tạo yêu cầu hoàn hàng từ OrderDetailPage.
 *
 * Props:
 *   order   — Order object đầy đủ (cần orderItems, id, orderCode)
 *   onClose — callback đóng modal
 */
export default function ReturnModal({ order, onClose }) {
  // Thêm tạm vào đầu component để kiểm tra
console.log('orderItems sample:', order.orderItems?.[0])
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')

  // Map: orderItemId → quantity muốn hoàn (0 = không chọn)
  // ReturnModal.jsx
  const [selectedQty, setSelectedQty] = useState(() => {
    const init = {}
    order.orderItems?.forEach((item) => {
      if (item.id != null) init[item.id] = 0
    })
    return init
  })

  const selectedItems = Object.entries(selectedQty)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ orderItemId: Number(id), quantity: qty }))

  const totalRefund = order.orderItems?.reduce((sum, item, index) => {
    const qty = selectedQty[item.id ?? item.orderItemId ?? index] ?? 0
    return sum + (qty * Number(item.unitPrice))
  }, 0) ?? 0

  const canSubmit =
    reason &&
    description.trim() &&
    selectedItems.length > 0

  const mutation = useMutation({
    mutationFn: () =>
      returnAPI.create({
        orderId: order.id,
        reason,
        description: description.trim(),
        items: selectedItems,
      }),
    onSuccess: (res) => {
      toast.success(`Đã tạo yêu cầu hoàn hàng ${res.data.returnCode}`)
      queryClient.invalidateQueries(['order', String(order.id)])
      onClose()
      navigate('/orders') // về trang danh sách đơn
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Không thể tạo yêu cầu hoàn hàng')
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center
                    bg-black/40 backdrop-blur-sm px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-auto">

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 p-5 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center
                          justify-center flex-shrink-0">
            <i className="fa-solid fa-rotate-left text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-800">Yêu cầu hoàn hàng</h3>
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

        {/* ── Body ─────────────────────────────────────────────────── */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Step 1: Chọn sản phẩm muốn hoàn */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2.5 block">
              Chọn sản phẩm muốn hoàn{' '}
              <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {order.orderItems?.map((item, index) => {
                // Và chỗ render itemId
                const itemId = item.id  
                const qty = selectedQty[itemId] ?? 0
                const maxQty = item.quantity

                return (
                  <div
                    key={itemId}
                    className={`border rounded-xl p-3 transition-all ${qty > 0
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 bg-white'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox tự chế */}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedQty(prev => ({
                            ...prev,
                            [itemId]: prev[itemId] > 0 ? 0 : 1,
                          }))
                        }
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center
                                    flex-shrink-0 transition-all ${qty > 0
                            ? 'bg-red-500 border-red-500 text-white'
                            : 'border-gray-300 hover:border-red-400'
                          }`}
                      >
                        {qty > 0 && <i className="fa-solid fa-check text-[10px]" />}
                      </button>

                      {/* Thumbnail */}
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                        {item.productImg
                          ? <img src={item.productImg} className="w-full h-full object-cover"
                            crossOrigin="anonymous" />
                          : <div className="w-full h-full flex items-center justify-center">
                            <i className="fa-solid fa-box text-gray-300 text-sm" />
                          </div>
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">
                          {item.productName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.variantName && `${item.variantName} · `}
                          {formatPrice(item.unitPrice)} × {item.quantity}
                        </p>
                      </div>

                      {/* Quantity selector — chỉ hiện khi checked */}
                      {qty > 0 && maxQty > 1 && (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedQty(prev => ({
                                ...prev,
                                [itemId]: Math.max(1, prev[itemId] - 1),
                              }))
                            }
                            className="w-6 h-6 rounded-full border border-gray-300
                                       flex items-center justify-center text-gray-600
                                       hover:bg-gray-100 text-xs"
                          >
                            <i className="fa-solid fa-minus text-[9px]" />
                          </button>
                          <span className="text-sm font-semibold w-4 text-center">{qty}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedQty(prev => ({
                                ...prev,
                                [itemId]: Math.min(maxQty, prev[itemId] + 1),
                              }))
                            }
                            className="w-6 h-6 rounded-full border border-gray-300
                                       flex items-center justify-center text-gray-600
                                       hover:bg-gray-100 text-xs"
                          >
                            <i className="fa-solid fa-plus text-[9px]" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Tổng tiền hoàn ước tính */}
            {selectedItems.length > 0 && (
              <div className="mt-2.5 flex items-center justify-between
                              bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                <span className="text-xs text-red-600 font-medium">
                  Ước tính hoàn tiền
                </span>
                <span className="text-sm font-bold text-red-600">
                  {formatPrice(totalRefund)}
                </span>
              </div>
            )}
          </div>

          {/* Step 2: Lý do */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2.5 block">
              Lý do hoàn hàng <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {RETURN_REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-3 p-3 border rounded-xl
                              cursor-pointer transition-all ${reason === r.value
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={(e) => setReason(e.target.value)}
                    className="accent-red-500 flex-shrink-0"
                  />
                  <i className={`fa-solid ${r.icon} text-gray-400 w-4 text-center`} />
                  <span className="text-sm text-gray-700">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Step 3: Mô tả */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
              Mô tả chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Mô tả cụ thể vấn đề bạn gặp phải, ảnh minh chứng nếu có..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-red-200
                         focus:border-red-300 resize-none transition-all
                         placeholder:text-gray-300"
            />
            <p className="text-right text-xs text-gray-300 mt-0.5">
              {description.length}/2000
            </p>
          </div>

          {/* Lưu ý chính sách */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
              <i className="fa-solid fa-circle-info" />Chính sách hoàn hàng
            </p>
            <ul className="space-y-1">
              {[
                'Sản phẩm còn nguyên tem, chưa qua sử dụng',
                'Yêu cầu trong vòng 7 ngày kể từ ngày nhận hàng',
                'Đính kèm đầy đủ phụ kiện và hộp đựng gốc',
                'Thời gian hoàn tiền 3–5 ngày làm việc sau khi duyệt',
              ].map((note, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <span className="mt-0.5 flex-shrink-0">•</span>{note}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <div className="flex gap-2.5 p-5 pt-0 border-t border-gray-100">
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
            disabled={!canSubmit || mutation.isPending}
            className="flex-[2] bg-red-500 text-white rounded-xl py-2.5 text-sm
                       font-medium hover:bg-red-600 disabled:opacity-50
                       disabled:cursor-not-allowed transition-colors
                       flex items-center justify-center gap-2"
          >
            {mutation.isPending
              ? <span className="flex items-center gap-2">
                <i className="fa-solid fa-spinner fa-spin" />Đang gửi...
              </span>
              : <span className="flex items-center gap-2">
                <i className="fa-solid fa-rotate-left" />Gửi yêu cầu hoàn hàng
              </span>
            }
          </button>
        </div>
      </div>
    </div>
  )
}