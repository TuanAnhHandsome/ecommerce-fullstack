import { useParams }                          from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState }                              from 'react'
import toast                                     from 'react-hot-toast'

import { orderAPI, paymentAPI, reviewAPI }  from '../services/api'
import { STATUS_CONFIG }                    from '../components/order/orderConstants'

// Order-detail sub-components
import OrderHeader          from '../components/order/OrderHeader'
import OrderCancelInfo      from '../components/order/OrderCancelInfo'
import OrderProgress        from '../components/order/OrderProgress'
import OrderRetryPayment    from '../components/order/OrderRetryPayment'
import OrderItems           from '../components/order/OrderItems'
import OrderReviewSection   from '../components/order/OrderReviewSection'
import OrderAfterSaleSection from '../components/order/OrderAfterSaleSection'
import OrderMeta            from '../components/order/OrderMeta'
import OrderCancelModal     from '../components/order/OrderCancelModal'

// Shared modals
import ReviewModal   from '../components/common/ReviewModal'
import WarrantyModal from '../components/common/WarrantyModal'
import ReturnModal   from '../components/common/ReturnModal'

// ── Skeleton loader ────────────────────────────────────────────────────────────
function OrderDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse space-y-4">
      <div className="h-6 bg-gray-200 rounded w-48"></div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="card p-6 h-32 bg-gray-100"></div>
      ))}
    </div>
  )
}

// ── Not-found state ────────────────────────────────────────────────────────────
function OrderNotFound() {
  return (
    <div className="text-center py-20">
      <i className="fa-solid fa-circle-exclamation text-4xl text-gray-300 mb-3 block"></i>
      <p className="text-gray-500">Không tìm thấy đơn hàng</p>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function OrderDetailPage() {
  const { id }        = useParams()
  const queryClient   = useQueryClient()

  // ── Modal / UI state ────────────────────────────────────────────────────────
  const [payLoading,       setPayLoading]       = useState(false)
  const [showCancelModal,  setShowCancelModal]  = useState(false)
  const [reviewTarget,     setReviewTarget]     = useState(null)
  const [showWarranty,     setShowWarranty]     = useState(false)
  const [showReturn,       setShowReturn]       = useState(false)

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn:  () => orderAPI.getById(id).then(r => r.data),
  })

  const { data: reviewedProductIds = new Set() } = useQuery({
    queryKey: ['reviewedProducts', id],
    queryFn:  () => reviewAPI.getReviewedProducts(id).then(r => new Set(r.data)),
    enabled:  order?.status === 'DELIVERED',
  })

  // ── Cancel mutation ──────────────────────────────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: (reason) => orderAPI.cancel(order.id, reason),
    onSuccess: () => {
      toast.success('Đã hủy đơn hàng thành công')
      setShowCancelModal(false)
      queryClient.invalidateQueries(['order', id])
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Không thể hủy đơn hàng')
    },
  })

  // ── Retry VNPay payment ──────────────────────────────────────────────────────
  const handleRetryPayment = async () => {
    setPayLoading(true)
    try {
      const { data: payment } = await paymentAPI.createVNPay(order.id)
      window.location.href = payment.paymentUrl
    } catch {
      toast.error('Không thể tạo link thanh toán')
    } finally {
      setPayLoading(false)
    }
  }

  // ── Render guards ────────────────────────────────────────────────────────────
  if (isLoading) return <OrderDetailSkeleton />
  if (!order)    return <OrderNotFound />

  const cfg         = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
  const currentStep = cfg.step
  const isDelivered = order.status === 'DELIVERED'

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* 1. Header — mã đơn, badge trạng thái, nút hủy */}
      <OrderHeader
        order={order}
        onCancelClick={() => setShowCancelModal(true)}
      />

      {/* 2. Banner lý do hủy (chỉ hiện khi CANCELLED / REFUNDED) */}
      <OrderCancelInfo order={order} />

      {/* 3. Thanh tiến trình (ẩn khi bị hủy) */}
      {currentStep >= 0 && <OrderProgress currentStep={currentStep} />}

      {/* 4. Nhắc thanh toán lại (VNPAY chưa TT) */}
      <OrderRetryPayment
        order={order}
        loading={payLoading}
        onRetry={handleRetryPayment}
      />

      {/* 5. Nội dung chính */}
      <div className="space-y-4">

        {/* Danh sách sản phẩm */}
        <OrderItems items={order.orderItems} />

        {/* Đánh giá — chỉ sau khi DELIVERED */}
        {isDelivered && (
          <OrderReviewSection
            items={order.orderItems}
            reviewedProductIds={reviewedProductIds}
            onReview={setReviewTarget}
          />
        )}

        {/* Bảo hành + Hoàn hàng — chỉ sau khi DELIVERED */}
        {isDelivered && (
          <OrderAfterSaleSection
            onWarranty={() => setShowWarranty(true)}
            onReturn={() => setShowReturn(true)}
          />
        )}

        {/* Thông tin giao hàng + thanh toán */}
        <OrderMeta order={order} />

      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {showCancelModal && (
        <OrderCancelModal
          order={order}
          onClose={() => setShowCancelModal(false)}
          onConfirm={(reason) => cancelMutation.mutate(reason)}
          isPending={cancelMutation.isPending}
        />
      )}

      {reviewTarget && (
        <ReviewModal
          item={reviewTarget}
          orderId={order.id}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => setReviewTarget(null)}
        />
      )}

      {showWarranty && (
        <WarrantyModal
          order={order}
          onClose={() => setShowWarranty(false)}
        />
      )}

      {showReturn && (
        <ReturnModal
          order={order}
          onClose={() => setShowReturn(false)}
        />
      )}

    </div>
  )
}