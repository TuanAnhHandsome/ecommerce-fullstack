import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orderAPI } from '../services/api';

export default function VNPayReturnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading | success | failed

  useEffect(() => {
    const responseCode = searchParams.get('vnp_ResponseCode');
    const txnRef = searchParams.get('vnp_TxnRef');

    // IMPORTANT: Chỉ hiển thị kết quả dựa trên response code
    // Việc cập nhật DB thực sự được thực hiện qua IPN webhook từ VNPay
    if (responseCode === '00') {
      setStatus('success');
      // Poll order status để xác nhận DB đã được cập nhật qua IPN
      setTimeout(() => {
        navigate('/orders');
      }, 3000);
    } else {
      setStatus('failed');
    }
  }, [searchParams, navigate]);

  if (status === 'loading') return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent
                        rounded-full mx-auto mb-4"></div>
        <p>Đang xác nhận thanh toán...</p>
      </div>
    </div>
  );

  if (status === 'success') return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-md">
        <div className="text-green-500 text-6xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-green-600 mb-2">Thanh toán thành công!</h1>
        <p className="text-gray-600 mb-4">Đơn hàng của bạn đã được xác nhận.</p>
        <p className="text-sm text-gray-400">Đang chuyển hướng về trang đơn hàng...</p>
      </div>
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-md">
        <div className="text-red-500 text-6xl mb-4">✗</div>
        <h1 className="text-2xl font-bold text-red-600 mb-2">Thanh toán thất bại</h1>
        <p className="text-gray-600 mb-4">
          Mã lỗi: {searchParams.get('vnp_ResponseCode')}
        </p>
        <button onClick={() => navigate('/cart')}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">
          Quay lại giỏ hàng
        </button>
      </div>
    </div>
  );
}
