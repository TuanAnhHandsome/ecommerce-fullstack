import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { reviewAPI, returnAPI } from '../../services/api'

const STAR_LABELS = ['', 'Rất tệ', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Rất hài lòng']

function StarSelector({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value

  return (
    <div className="text-center">
      <p className="text-xs text-gray-500 mb-2">
        Chọn số sao đánh giá <span className="text-red-500">*</span>
      </p>
      <div className="flex gap-1.5 justify-center" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <i className={`fa-star text-3xl transition-colors ${
              star <= display
                ? 'fa-solid text-amber-400'
                : 'fa-regular text-gray-300'
            }`} />
          </button>
        ))}
      </div>
      <p className={`text-xs mt-1.5 font-medium h-4 transition-colors ${
        display ? 'text-amber-600' : 'text-transparent'
      }`}>
        {STAR_LABELS[display]}
      </p>
    </div>
  )
}

function ImageUploader({ images, onChange }) {
  const inputRef = useRef(null)

  const handleFiles = (e) => {
    const files = Array.from(e.target.files)
    const remaining = 5 - images.length
    const toAdd = files.slice(0, remaining)
    onChange([...images, ...toAdd])
    e.target.value = ''
  }

  const remove = (idx) => onChange(images.filter((_, i) => i !== idx))

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">
        Ảnh thực tế{' '}
        <span className="text-gray-400">(tối đa 5 ảnh)</span>
      </p>
      <div className="flex gap-2 flex-wrap">
        {images.map((file, idx) => (
          <div key={idx} className="relative w-14 h-14 flex-shrink-0">
            <img
              src={URL.createObjectURL(file)}
              className="w-full h-full object-cover rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={() => remove(idx)}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-700 text-white
                         rounded-full flex items-center justify-center text-xs leading-none"
            >
              <i className="fa-solid fa-xmark text-[9px]" />
            </button>
          </div>
        ))}
        {images.length < 5 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-300
                       hover:border-red-400 hover:bg-red-50 flex flex-col items-center
                       justify-center gap-0.5 text-gray-400 hover:text-red-400
                       transition-colors flex-shrink-0"
          >
            <i className="fa-solid fa-plus text-sm" />
            <span className="text-[9px] font-medium">Thêm</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
      </div>
    </div>
  )
}

/**
 * ReviewModal — review 1 sản phẩm cụ thể từ OrderDetailPage.
 *
 * Props:
 *   item      — OrderItem object { productId, productName, productImg, variantName }
 *   orderId   — Long, dùng để verify DELIVERED phía backend
 *   onClose   — callback đóng modal
 *   onSuccess — callback sau khi submit thành công
 */
export default function ReviewModal({ item, orderId, onClose, onSuccess }) {
  const queryClient = useQueryClient()
  const [rating, setRating]     = useState(0)
  const [title, setTitle]       = useState('')
  const [comment, setComment]   = useState('')
  const [images, setImages]     = useState([])

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      // Backend nhận @RequestPart("review") là JSON blob
      fd.append('review', new Blob([JSON.stringify({
        rating,
        title:   title.trim() || null,
        comment: comment.trim() || null,
        orderId,
      })], { type: 'application/json' }))
      images.forEach((img) => fd.append('images', img))
      return reviewAPI.create(item.productId, fd)
    },
    onSuccess: () => {
      toast.success('Đã gửi đánh giá thành công!')
      // Invalidate để ProductDetail refresh
      queryClient.invalidateQueries(['reviews', item.productId])
      // Invalidate reviewed-products của order này
      queryClient.invalidateQueries(['reviewedProducts', orderId])
      onSuccess?.(item.productId)
      onClose()
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Không thể gửi đánh giá')
    },
  })

  const canSubmit = rating > 0 && !mutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex items-start gap-3 p-5 pb-0">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
            {item.productImg
              ? <img src={item.productImg} className="w-full h-full object-cover" crossOrigin="anonymous" />
              : <div className="w-full h-full flex items-center justify-center">
                  <i className="fa-solid fa-box text-gray-300 text-xl" />
                </div>
            }
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm font-semibold text-gray-800 line-clamp-1">{item.productName}</p>
            {item.variantName && (
              <p className="text-xs text-gray-400 mt-0.5">{item.variantName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center
                       text-gray-400 transition-colors flex-shrink-0"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────── */}
        <div className="p-5 space-y-4">

          {/* Stars */}
          <StarSelector value={rating} onChange={setRating} />

          {/* Title */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Tiêu đề ngắn</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              placeholder="VD: Sản phẩm chất lượng, giao hàng nhanh"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300
                         transition-all placeholder:text-gray-300"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Nhận xét chi tiết</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Chia sẻ trải nghiệm thực tế của bạn về sản phẩm..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300
                         resize-none transition-all placeholder:text-gray-300"
            />
            <p className="text-right text-xs text-gray-300 mt-0.5">{comment.length}/2000</p>
          </div>

          {/* Image upload */}
          <ImageUploader images={images} onChange={setImages} />

          {/* Verified badge info */}
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
            <i className="fa-solid fa-circle-check text-green-500 text-xs flex-shrink-0" />
            <p className="text-xs text-green-700">
              Đánh giá sẽ được gắn nhãn <span className="font-semibold">Đã mua hàng</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5
                         text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Để sau
            </button>
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={!canSubmit}
              className="flex-2 flex-[2] bg-red-500 text-white rounded-xl py-2.5 text-sm
                         font-medium hover:bg-red-600 disabled:opacity-50
                         disabled:cursor-not-allowed transition-colors
                         flex items-center justify-center gap-2"
            >
              {mutation.isPending
                ? <><i className="fa-solid fa-spinner fa-spin" /> Đang gửi...</>
                : <><i className="fa-solid fa-star" /> Gửi đánh giá</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
