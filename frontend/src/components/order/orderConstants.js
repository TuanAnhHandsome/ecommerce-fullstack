// ── Status config ──────────────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  PENDING:          { label:'Chờ xử lý',      color:'bg-gray-100 text-gray-600',     icon:'fa-clock',        step:0  },
  AWAITING_PAYMENT: { label:'Chờ thanh toán', color:'bg-yellow-100 text-yellow-700', icon:'fa-credit-card',  step:1  },
  PAID:             { label:'Đã thanh toán',   color:'bg-blue-100 text-blue-700',     icon:'fa-circle-check', step:2  },
  PROCESSING:       { label:'Đang xử lý',      color:'bg-purple-100 text-purple-700', icon:'fa-gear',         step:3  },
  SHIPPED:          { label:'Đang giao',        color:'bg-orange-100 text-orange-700', icon:'fa-truck',        step:4  },
  DELIVERED:        { label:'Đã giao',          color:'bg-green-100 text-green-700',   icon:'fa-box-open',     step:5  },
  CANCELLED:        { label:'Đã huỷ',           color:'bg-red-100 text-red-600',       icon:'fa-ban',          step:-1 },
  REFUNDED:         { label:'Đã hoàn tiền',     color:'bg-gray-100 text-gray-600',     icon:'fa-rotate-left',  step:-1 },
}

export const STEPS = [
  { label:'Đặt hàng',   icon:'fa-cart-shopping' },
  { label:'Chờ TT',     icon:'fa-credit-card'   },
  { label:'Đã TT',      icon:'fa-circle-check'  },
  { label:'Xử lý',      icon:'fa-gear'          },
  { label:'Giao hàng',  icon:'fa-truck'         },
  { label:'Hoàn thành', icon:'fa-box-open'      },
]

export const CANCEL_REASONS = [
  'Tôi muốn thay đổi địa chỉ giao hàng',
  'Tôi muốn thay đổi sản phẩm/số lượng',
  'Tìm được giá rẻ hơn ở nơi khác',
  'Đặt nhầm sản phẩm',
  'Không còn nhu cầu mua nữa',
  'Lý do khác',
]

// ── Helpers ────────────────────────────────────────────────────────────────────
export const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p) + 'đ'
export const formatDate  = (d) => new Date(d).toLocaleString('vi-VN')
