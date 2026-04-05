export default function StarRating({ rating, size = 'sm' }) {
  const sz = size === 'sm' ? 'text-sm' : 'text-base'
  return (
    <div className={`flex gap-0.5 ${sz}`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}>★</span>
      ))}
    </div>
  )
}
