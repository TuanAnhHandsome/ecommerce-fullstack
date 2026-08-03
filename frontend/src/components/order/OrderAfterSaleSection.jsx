/**
 * OrderAfterSaleSection
 * Nút mở modal Bảo hành và Hoàn hàng.
 * Chỉ render khi status === 'DELIVERED'.
 */
export default function OrderAfterSaleSection({ onWarranty, onReturn }) {
  return (
    <div className="card p-5">
      <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
        <i className="fa-solid fa-headset text-gray-400"></i>Hỗ trợ sau mua hàng
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {/* Bảo hành */}
        <button
          onClick={onWarranty}
          className="flex flex-col items-center gap-2 p-4 border border-blue-200
            bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 group-hover:bg-blue-200
            flex items-center justify-center transition-colors">
            <i className="fa-solid fa-shield-halved text-blue-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-blue-700">Bảo hành / Sửa chữa</p>
            <p className="text-xs text-blue-500 mt-0.5">Sản phẩm gặp sự cố kỹ thuật</p>
          </div>
        </button>

        {/* Hoàn hàng */}
        <button
          onClick={onReturn}
          className="flex flex-col items-center gap-2 p-4 border border-red-200
            bg-red-50 hover:bg-red-100 rounded-xl transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-red-100 group-hover:bg-red-200
            flex items-center justify-center transition-colors">
            <i className="fa-solid fa-rotate-left text-red-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-red-700">Hoàn hàng / Hoàn tiền</p>
            <p className="text-xs text-red-500 mt-0.5">Đổi trả trong 7 ngày</p>
          </div>
        </button>
      </div>
    </div>
  )
}
