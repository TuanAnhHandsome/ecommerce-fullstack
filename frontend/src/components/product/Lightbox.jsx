import { useState, useEffect, useCallback } from 'react'

export default function Lightbox({ images, initialIndex, onClose }) {
  const [idx, setIdx] = useState(initialIndex)
  const prev = useCallback(() => setIdx(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setIdx(i => (i + 1) % images.length), [images.length])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 z-10">
        <i className="fa-solid fa-xmark text-2xl"></i>
      </button>
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm bg-black/40 px-3 py-1 rounded-full">
          {idx + 1} / {images.length}
        </div>
      )}
      {images.length > 1 && (
        <button onClick={(e) => { e.stopPropagation(); prev() }}
          className="absolute left-3 md:left-6 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 z-10">
          <i className="fa-solid fa-chevron-left text-xl"></i>
        </button>
      )}
      <img
        src={images[idx]}
        alt={`Ảnh ${idx + 1}`}
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl select-none"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
      {images.length > 1 && (
        <button onClick={(e) => { e.stopPropagation(); next() }}
          className="absolute right-3 md:right-6 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 z-10">
          <i className="fa-solid fa-chevron-right text-xl"></i>
        </button>
      )}
      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button key={i} onClick={(e) => { e.stopPropagation(); setIdx(i) }}
              className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'}`} />
          ))}
        </div>
      )}
    </div>
  )
}