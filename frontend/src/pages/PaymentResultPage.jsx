import { useSearchParams, useNavigate } from 'react-router-dom'

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const status = searchParams.get('status')
  const txnRef = searchParams.get('txnRef')
  const isSuccess = status === 'success'

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      {isSuccess ? (
        <>
          <div className="text-green-500 text-6xl mb-4">
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thành công!</h1>
          <p className="text-gray-500 mb-2">
            Mã đơn hàng: <span className="font-semibold">{txnRef}</span>
          </p>
          <button onClick={() => navigate('/orders')} className="btn-primary mt-6 px-8 py-3">
            <i className="fa-solid fa-list mr-2"></i>Xem đơn hàng
          </button>
        </>
      ) : (
        <>
          <div className="text-red-500 text-6xl mb-4">
            <i className="fa-solid fa-circle-xmark"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thất bại</h1>
          <p className="text-gray-500 mb-2">
            Mã đơn hàng: <span className="font-semibold">{txnRef}</span>
          </p>
          <button onClick={() => navigate('/checkout')} className="btn-primary mt-6 px-8 py-3">
            <i className="fa-solid fa-rotate-left mr-2"></i>Thử lại
          </button>
        </>
      )}
    </div>
  )
}