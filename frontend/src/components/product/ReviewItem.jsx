import StarRating from './StarRating'

export default function ReviewItem({ review }) {
  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-semibold flex-shrink-0">
            {review.userName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">{review.userName}</span>
              {review.verified && (
                <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-medium">
                  <i className="fa-solid fa-circle-check mr-1"></i>Đã mua hàng
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating rating={review.rating} />
              <span className="text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>
        </div>
      </div>
      {review.title && <p className="text-sm font-medium text-gray-700 mb-1">{review.title}</p>}
      {review.comment && <p className="text-sm text-gray-500 leading-relaxed">{review.comment}</p>}
      {review.images?.length > 0 && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {review.images.map((url, i) => (
            <img
              key={i}
              src={url}
              className="w-16 h-16 rounded-lg object-cover border border-gray-100"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
          ))}
        </div>
      )}
    </div>
  )
}