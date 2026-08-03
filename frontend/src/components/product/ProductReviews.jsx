import StarRating from './StarRating'
import ReviewItem from './ReviewItem'

export default function ProductReviews({ product, reviewData, reviewPage, setReviewPage, isAuthenticated }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
        <i className="fa-solid fa-star text-amber-400 text-base"></i>
        Đánh giá sản phẩm
      </h2>

      {product.avgRating > 0 ? (
        <div className="flex gap-8 items-center mb-6 p-4 bg-gray-50 rounded-xl">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-800">{product.avgRating}</div>
            <StarRating rating={product.avgRating} size="base" />
            <div className="text-xs text-gray-400 mt-1">{product.reviewCount} đánh giá</div>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map(star => {
              const count = reviewData?.distribution?.[star] || 0
              const pct = product.reviewCount > 0 ? (count / product.reviewCount) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 w-6 text-right">{star}</span>
                  <span className="text-amber-400 text-xs">★</span>
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-gray-400 w-6">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl mb-5">
          <i className="fa-regular fa-star text-3xl mb-2 block"></i>
          <p className="text-sm">Chưa có đánh giá nào</p>
          {isAuthenticated && (
            <p className="text-xs mt-1">Hãy là người đầu tiên đánh giá sản phẩm này!</p>
          )}
        </div>
      )}

      {/* Review list */}
      {reviewData?.reviews?.length > 0 ? (
        <>
          <div>
            {reviewData.reviews.map(rv => <ReviewItem key={rv.id} review={rv} />)}
          </div>
          {reviewData.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {[...Array(reviewData.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setReviewPage(i)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    reviewPage === i ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      ) : product.avgRating > 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Đang tải đánh giá...</p>
      ) : null}
    </div>
  )
}