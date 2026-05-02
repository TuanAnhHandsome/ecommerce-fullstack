import { useSearchParams, useNavigate } from 'react-router-dom'

const CheckIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="14" stroke="#639922" strokeWidth="1.5"/>
    <path d="M10 16l4 4 8-8" stroke="#639922" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const XIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="14" stroke="#E24B4A" strokeWidth="1.5"/>
    <path d="M11 11l10 10M21 11l-10 10" stroke="#E24B4A" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const TickSmall = ({ color = '#fff' }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M2 5l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const XSmall = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M3 3l4 4M7 3l-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

function StepTracker({ isSuccess }) {
  const steps = ['Đặt hàng', 'Thanh toán', 'Xác nhận']

  return (
    <div style={{ display: 'flex', marginBottom: '2rem' }}>
      {steps.map((label, i) => {
        const isDone = isSuccess ? i <= 2 : i === 0
        const isFailed = !isSuccess && i === 1
        const isLast = i === steps.length - 1

        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            {!isLast && (
              <div style={{
                position: 'absolute', top: 10, left: '50%', width: '100%', height: '1px',
                background: 'var(--color-border-tertiary)', zIndex: 0
              }} />
            )}
            <div style={{
              width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', position: 'relative', zIndex: 1,
              background: isFailed ? '#E24B4A' : isDone ? '#639922' : 'var(--color-background-primary)',
              border: `0.5px solid ${isFailed ? '#E24B4A' : isDone ? '#639922' : 'var(--color-border-secondary)'}`,
            }}>
              {isFailed ? <XSmall /> : isDone ? <TickSmall /> : (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-border-secondary)' }} />
              )}
            </div>
            <span style={{
              fontSize: 11, marginTop: 6, textAlign: 'center',
              color: isFailed ? '#A32D2D' : isDone ? '#3B6D11' : 'var(--color-text-secondary)'
            }}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const status = searchParams.get('status')
  const txnRef = searchParams.get('txnRef')
  const isSuccess = status === 'success'

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'var(--font-sans)' }}>
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '2.5rem 2rem',
      }}>
        <StepTracker isSuccess={isSuccess} />

        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1.5rem',
          background: isSuccess ? '#EAF3DE' : '#FCEBEB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isSuccess ? <CheckIcon /> : <XIcon />}
        </div>

        {/* Title */}
        <p style={{ fontSize: 20, fontWeight: 500, textAlign: 'center', margin: '0 0 0.4rem', color: 'var(--color-text-primary)' }}>
          {isSuccess ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
        </p>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', textAlign: 'center', margin: '0 0 2rem' }}>
          {isSuccess
            ? 'Đơn hàng của bạn đã được xác nhận và đang được xử lý.'
            : 'Giao dịch không thể hoàn tất. Vui lòng kiểm tra lại và thử lại.'}
        </p>

        {/* Detail box */}
        <div style={{
          background: 'var(--color-background-secondary)',
          borderRadius: 'var(--border-radius-md)',
          padding: '1rem 1.25rem', marginBottom: '1.5rem',
        }}>
          {[
            { label: 'Mã đơn hàng', value: txnRef || '—' },
            { label: 'Phương thức', value: 'VNPay' },
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 0', fontSize: 13,
              borderBottom: '0.5px solid var(--color-border-tertiary)',
            }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
              <span style={{ fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 13 }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Trạng thái</span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500,
              background: isSuccess ? '#EAF3DE' : '#FCEBEB',
              color: isSuccess ? '#3B6D11' : '#A32D2D',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: isSuccess ? '#639922' : '#E24B4A',
              }} />
              {isSuccess ? 'Đã thanh toán' : 'Thất bại'}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <button
          onClick={() => navigate(isSuccess ? '/orders' : '/checkout')}
          style={{
            width: '100%', padding: 12, borderRadius: 'var(--border-radius-md)',
            fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none',
            background: isSuccess ? '#639922' : 'var(--color-background-primary)',
            color: isSuccess ? '#fff' : 'var(--color-text-primary)',
            borderWidth: isSuccess ? 0 : '0.5px',
            borderStyle: 'solid',
            borderColor: 'var(--color-border-secondary)',
            fontFamily: 'inherit',
          }}
        >
          {isSuccess ? 'Xem đơn hàng' : 'Thử lại thanh toán'}
        </button>

        <button
          onClick={() => navigate('/')}
          style={{
            width: '100%', padding: 11, marginTop: 8,
            borderRadius: 'var(--border-radius-md)', fontSize: 14,
            cursor: 'pointer', background: 'transparent',
            border: '0.5px solid var(--color-border-tertiary)',
            color: 'var(--color-text-secondary)', fontFamily: 'inherit',
          }}
        >
          Tiếp tục mua sắm
        </button>
      </div>
    </div>
  )
}