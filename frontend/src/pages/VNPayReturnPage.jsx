import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

export default function VNPayReturnPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const responseCode = searchParams.get('vnp_ResponseCode')
    const txnRef = searchParams.get('vnp_TxnRef')

    if (responseCode === '00') {
      navigate(`/payment/result?status=success&txnRef=${txnRef}`, { replace: true })
    } else if (responseCode) {
      navigate(`/payment/result?status=failed&txnRef=${txnRef}`, { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Đang xác nhận thanh toán...</p>
      </div>
    </div>
  )
}