import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-gray-100 mb-2 select-none">404</div>
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto -mt-8 mb-6 relative z-10">
          <i className="fa-solid fa-map-location-dot text-3xl text-red-400"></i>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Trang không tồn tại</h1>
        <p className="text-gray-500 mb-8">Trang bạn đang tìm kiếm đã bị xoá, đổi tên hoặc chưa bao giờ tồn tại.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => window.history.back()}
            className="btn-secondary flex items-center gap-2">
            <i className="fa-solid fa-arrow-left"></i>Quay lại
          </button>
          <Link to="/" className="btn-primary flex items-center gap-2">
            <i className="fa-solid fa-house"></i>Trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}
