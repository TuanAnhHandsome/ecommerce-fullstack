import { useEffect, useRef } from 'react'

export default function ProductImages({
  displayImages,
  activeImg,
  setActiveImg,
  isOnSale,
  discountPct,
  wishlist,
  setWishlist,
  onOpenLightbox,
}) {
  const thumbRefs = useRef([])
  const thumbContainerRef = useRef(null)

  // Khi activeImg đổi → auto scroll thumbnail vào view
  useEffect(() => {
    const el = thumbRefs.current[activeImg]
    if (el && thumbContainerRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [activeImg])

  const goPrev = () => setActiveImg(i => (i - 1 + displayImages.length) % displayImages.length)
  const goNext = () => setActiveImg(i => (i + 1) % displayImages.length)

  return (
    <div>
      {/* ── Ảnh chính ── */}
      <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-3 border border-gray-100 group">
        {displayImages.length > 0 ? (
          <img
            src={displayImages[activeImg]}
            alt="Ảnh sản phẩm"
            className="w-full h-full object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.02]"
            onClick={onOpenLightbox}
            draggable={false}
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
            <i className="fa-solid fa-image text-8xl mb-3"></i>
            <span className="text-sm">Chưa có ảnh</span>
          </div>
        )}

        {/* Badge sale */}
        {isOnSale && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
            -{discountPct}%
          </div>
        )}

        {/* Wishlist */}
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setWishlist(w => !w)}
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-all ${
              wishlist ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-500 hover:text-red-500'
            }`}
          >
            <i className={`fa-${wishlist ? 'solid' : 'regular'} fa-heart text-sm`}></i>
          </button>
        </div>

        {/* Hint phóng to */}
        {displayImages.length > 0 && (
          <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <i className="fa-solid fa-magnifying-glass-plus mr-1"></i>Click để phóng to
          </div>
        )}

        {/* Prev / Next */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md text-gray-700 w-9 h-9 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            >
              <i className="fa-solid fa-chevron-left text-sm"></i>
            </button>
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md text-gray-700 w-9 h-9 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            >
              <i className="fa-solid fa-chevron-right text-sm"></i>
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {displayImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeImg ? 'w-5 bg-red-500' : 'w-1.5 bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Thumbnails ── */}
      {displayImages.length > 1 && (
        <div
          ref={thumbContainerRef}
          className="flex gap-2 overflow-x-auto pb-1 scroll-smooth"
          style={{ scrollbarWidth: 'none' }}
        >
          {displayImages.map((img, i) => (
            <button
              key={i}
              ref={el => thumbRefs.current[i] = el}
              onClick={() => setActiveImg(i)}
              className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                activeImg === i
                  ? 'border-red-500 scale-105 shadow-sm'
                  : 'border-gray-200 opacity-60 hover:opacity-90 hover:border-gray-300'
              }`}
            >
              <img
                src={img}
                className="w-full h-full object-cover"
                draggable={false}
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}