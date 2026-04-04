import { useState } from 'react'

export default function VNPayTestCard() {
  const [expanded, setExpanded] = useState(true)
  const [copied, setCopied] = useState(null)

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

  return (
    <div className="fixed bottom-6 right-6 z-50 font-mono">
      
      {/* Card */}
      {expanded && (
        <div className="w-[320px] rounded-2xl overflow-hidden
          bg-gradient-to-br from-black via-slate-900 to-slate-800
          border border-white/10 shadow-2xl animate-[fadeUp_.3s_ease]">

          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-white text-xs font-bold tracking-wider">
                VNPAY SANDBOX
              </span>
            </div>

            <button
              onClick={() => setExpanded(false)}
              className="w-6 h-6 flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 text-gray-400"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Fake Card */}
          <div className="mx-4 mt-4 p-4 rounded-xl bg-gradient-to-br from-blue-900 to-slate-900 border border-white/10 relative">
            <div className="text-gray-400 text-[10px] mb-2 tracking-widest">
              NCB BANK
            </div>

            <div className="text-white tracking-[3px] text-sm font-bold mb-3">
              9704 1985 2619 1432
            </div>

            <div className="flex justify-between text-xs text-white/80">
              <div>
                <p className="text-[9px] text-gray-400">CARDHOLDER</p>
                <p>NGUYEN VAN A</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-gray-400">EXPIRES</p>
                <p>07/15</p>
              </div>
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
                    <p className={`text-sm font-semibold ${f.highlight ? 'text-green-400' : 'text-white'}`}>
                      {f.value}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(f.value, f.label)}
                  className={`text-xs px-2 py-1 rounded-md border transition
                    ${copied === f.label
                      ? 'bg-green-400/20 text-green-400 border-green-400/40'
                      : 'bg-white/10 text-gray-400 border-white/10 hover:bg-white/20'
                    }`}
                >
                  {copied === f.label ? '✓' : 'copy'}
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] text-gray-500 border-t border-white/10 py-2">
            Sandbox only • Không dùng thanh toán thật
          </div>
        </div>
      )}

      {/* Toggle */}
      <div className="flex justify-end mt-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center justify-center transition-all
          ${expanded
            ? 'w-10 h-10 bg-white/10 text-white rounded-xl'
            : 'w-14 h-14 bg-gradient-to-br from-orange-500 to-yellow-400 text-white rounded-full shadow-lg'
          }`}
        >
          <i className={`fa-solid ${expanded ? 'fa-minus' : 'fa-credit-card'} text-lg`}></i>
        </button>
      </div>
    </div>
  )
}