import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { variantAPI } from '../../../services/api'

/**
 * ImagesTab – ảnh chính sản phẩm (1 ảnh) + xem ảnh từ biến thể.
 *
 * Ảnh từ biến thể chỉ hiển thị để tham khảo, không upload lại ở đây.
 * Upload ảnh biến thể → làm tại tab Biến thể.
 */
export default function ImagesTab({
  productId,
  existingImages,
  setExistingImages,
  newImages,
  setNewImages,
  deletedImageIds,
  setDeletedImageIds,
}) {
  const fileInputRef = useRef(null)

  // Lấy ảnh từ các biến thể để hiển thị tham khảo
  const { data: variantData } = useQuery({
    queryKey: ['variants', productId],
    queryFn: () => productId ? variantAPI.getByProduct(productId).then(r => r.data) : null,
    enabled: !!productId,
  })

  const variantImages = variantData?.variants?.flatMap(v =>
    (v.images ?? []).map(url => ({ url, label: v.valueLabels?.join(' / ') ?? '' }))
  ) ?? []

  // Ảnh chính hiện tại (chỉ lấy 1)
  const mainImage = existingImages[0] ?? null
  const newMain = newImages[0] ?? null

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Revoke preview cũ nếu có
    if (newImages[0]) URL.revokeObjectURL(newImages[0].preview)

    setNewImages([{ file, preview: URL.createObjectURL(file) }])
    e.target.value = ''
  }

  const removeMain = () => {
    if (newMain) {
      URL.revokeObjectURL(newMain.preview)
      setNewImages([])
    } else if (mainImage) {
      if (mainImage.id) setDeletedImageIds(prev => [...prev, mainImage.id])
      setExistingImages([])
    }
  }

  const currentSrc = newMain?.preview ?? mainImage?.url ?? null

  return (
    <div className="space-y-6">

      {/* ── Ảnh chính sản phẩm ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-700">
              <i className="fa-solid fa-image mr-1.5 text-gray-400"></i>
              Ảnh chính sản phẩm
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Hiển thị khi chưa chọn biến thể nào</p>
          </div>
          {currentSrc && (
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors">
              <i className="fa-solid fa-arrows-rotate"></i>Đổi ảnh
            </button>
          )}
        </div>

        {currentSrc ? (
          <div className="relative group w-40 h-40 rounded-2xl overflow-hidden border-2 border-gray-200">
            <img src={currentSrc} className="w-full h-full object-cover"
              crossOrigin="anonymous" referrerPolicy="no-referrer" />
            {newMain && (
              <div className="absolute top-2 left-2 bg-blue-500/80 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">Mới</div>
            )}
            <button type="button" onClick={removeMain}
              className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
              <i className="fa-solid fa-xmark text-xs"></i>
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-10 flex flex-col items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-colors">
            <i className="fa-solid fa-cloud-arrow-up text-3xl mb-2"></i>
            <span className="text-sm font-medium">Click để chọn ảnh chính</span>
            <span className="text-xs mt-1">JPG, PNG · Tối đa 5MB</span>
          </button>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={handleFileSelect} />
      </div>

      {/* ── Ảnh từ biến thể (chỉ đọc) ── */}
      {variantImages.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-1">
            <i className="fa-solid fa-layer-group mr-1.5 text-gray-400"></i>
            Ảnh từ biến thể
          </p>
          <p className="text-xs text-gray-400 mb-3">
            Tự động hiển thị khi người dùng chọn biến thể tương ứng.
            Để thay đổi → vào tab <span className="font-medium text-gray-600">Biến thể & Tồn kho</span>.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {variantImages.map((img, i) => (
              <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border-2 border-purple-100">
                <img src={img.url} className="w-full h-full object-cover"
                  crossOrigin="anonymous" referrerPolicy="no-referrer" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-1 text-center truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {img.label}
                </div>
                <div className="absolute top-1.5 right-1.5 bg-purple-500/80 text-white text-[9px] px-1 py-0.5 rounded font-medium">
                  Biến thể
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hint nếu không có gì */}
      {!currentSrc && variantImages.length === 0 && !productId && (
        <div className="text-center py-4 text-xs text-gray-400">
          Lưu thông tin sản phẩm trước để thêm ảnh biến thể
        </div>
      )}
    </div>
  )
}