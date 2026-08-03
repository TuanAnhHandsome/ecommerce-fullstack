import { useState, useRef, useEffect } from 'react'

export default function VNPayTestCard() {
  const [expanded, setExpanded] = useState(true)
  const [copied, setCopied] = useState(null)
  const cardRef = useRef(null)

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 1200)
  }

  const fields = [
    { label: 'Ngân hàng', value: 'NCB', icon: 'fa-building-columns' },
    { label: 'Số thẻ', value: '9704198526191432198', icon: 'fa-credit-card', mono: true },
    { label: 'Tên chủ thẻ', value: 'NGUYEN VAN A', icon: 'fa-user' },
    { label: 'Ngày phát hành', value: '07/15', icon: 'fa-calendar' },
    { label: 'OTP', value: '123456', icon: 'fa-lock', highlight: true },
  ]

  useEffect(() => {
  const handleClickOutside = (e) => {
    if (cardRef.current && !cardRef.current.contains(e.target)) {
      setExpanded(false)
    }
  }
  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [])

  return (
    <div ref={cardRef} className="fixed bottom-6 right-6 z-50 font-mono">
      {/* Card */}
      {expanded && (
        <div className="w-[340px] rounded-2xl overflow-hidden
          bg-white
          border border-gray-200 shadow-2xl animate-[fadeUp_.3s_ease]">

          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-cyan-400/10 bg-cyan-400/5">
            <div>
              <p className="text-[10px] text-cyan-700 tracking-widest font-bold">
                VNPAY TEST CARD
              </p>
              <p className="text-[11px] text-gray-700">
                Hướng dẫn thanh toán thử nghiệm
              </p>
            </div>

            <button
              onClick={() => setExpanded(false)}
              className="w-6 h-6 flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 text-gray-600"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Guide */}
          <div className="px-4 pt-4">
            <div className="rounded-xl border border-amber-300/20 bg-red-50 p-3">
              <p className="text-amber-700 text-[11px] font-bold mb-2">
                HƯỚNG DẪN SỬ DỤNG
              </p>
              <ul className="text-[11px] text-gray-700 space-y-1 leading-relaxed">
                <li>• Chọn phương thức thanh toán VNPAY</li>
                <li>• Sao chép thông tin thẻ bên dưới</li>
                <li>• Nhập đúng OTP: 123456</li>
                <li>• Đây chỉ là thẻ Sandbox, không trừ tiền thật</li>
              </ul>
            </div>
          </div>

          {/* Info */}
          <div className="p-3 space-y-1">
            {fields.map(f => (
              <div
                key={f.label}
                className={`flex justify-between items-center px-3 py-2 rounded-lg border transition
                ${f.highlight
                    ? 'border-green-400/30 bg-green-400/5'
                    : 'border-transparent hover:bg-white/5'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <i className={`fa-solid ${f.icon} text-xs text-gray-400 w-4`}></i>

                  <div>
                    <p className="text-[10px] text-gray-400">{f.label}</p>
                    <p className={`text-sm font-semibold ${f.highlight ? 'text-green-600' : 'text-gray-800'}`}>
                      {f.value}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(f.value, f.label)}
                  className={`text-xs px-2 py-1 rounded-md border transition
                    ${copied === f.label
                      ? 'bg-green-400/20 text-green-400 border-green-400/40'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {copied === f.label ? '✓' : 'copy'}
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center text-[15px] text-gray-600 font-bold border-t border-white/10 py-2">
            Sandbox only • Giả lập thanh toán
          </div>
        </div>
      )}

      {/* Toggle */}
      <div className="flex justify-end mt-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center justify-center transition-all
          ${expanded
              ? 'w-10 h-10 bg-cyan-100 text-cyan-700 rounded-xl'
              : 'w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-full shadow-lg'
            }`}
        >
          <i className={`fa-solid ${expanded ? 'fa-minus' : 'fa-credit-card'} text-lg`}></i>
        </button>
      </div>
    </div>
  )
}
