import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { warrantyAPI } from '../services/api'

// ─── Constants ────────────────────────────────────────────────────────────────
const WARRANTY_STEPS = [
  { key: 'PENDING',    label: 'Tiếp nhận',       icon: 'fa-inbox',        desc: 'Yêu cầu đã được ghi nhận'         },
  { key: 'RECEIVED',   label: 'Đã nhận máy',      icon: 'fa-box-open',     desc: 'Sản phẩm về tới trung tâm'        },
  { key: 'DIAGNOSING', label: 'Kiểm tra',         icon: 'fa-magnifying-glass', desc: 'Kỹ thuật viên đang chẩn đoán' },
  { key: 'REPAIRING',  label: 'Sửa chữa',         icon: 'fa-screwdriver-wrench', desc: 'Tiến hành sửa/thay linh kiện'},
  { key: 'REPAIRED',   label: 'Hoàn tất SC',      icon: 'fa-circle-check', desc: 'Sản phẩm đã xử lý xong'           },
  { key: 'RETURNING',  label: 'Đang trả về',      icon: 'fa-truck',        desc: 'Đang giao trả sản phẩm'           },
  { key: 'COMPLETED',  label: 'Hoàn tất',         icon: 'fa-star',         desc: 'Quá trình bảo hành hoàn tất'      },
]

const TYPE_META = {
  WARRANTY: { label: 'Bảo hành',  icon: 'fa-shield-halved',      color: 'bg-blue-100 text-blue-700'   },
  REPAIR:   { label: 'Sửa chữa',  icon: 'fa-screwdriver-wrench', color: 'bg-amber-100 text-amber-700' },
  EXCHANGE: { label: 'Đổi hàng',  icon: 'fa-arrow-right-arrow-left', color: 'bg-purple-100 text-purple-700'},
  RETURN:   { label: 'Trả hàng',  icon: 'fa-rotate-left',        color: 'bg-red-100 text-red-600'     },
}

const fmt = (d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

// ─── Timeline dọc ─────────────────────────────────────────────────────────────
function WarrantyTimeline({ status }) {
  const currentIdx = WARRANTY_STEPS.findIndex(s => s.key === status)

  return (
    <div className="space-y-0">
      {WARRANTY_STEPS.map((step, idx) => {
        const done    = idx < currentIdx
        const active  = idx === currentIdx
        const pending = idx > currentIdx
        const isLast  = idx === WARRANTY_STEPS.length - 1

        return (
          <div key={step.key} className="flex gap-3">
            {/* Dot + line */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`
                w-9 h-9 rounded-full flex items-center justify-center border-2 text-xs transition-all duration-500
                ${done    ? 'bg-red-500 border-red-500 text-white shadow-sm shadow-red-200'            : ''}
                ${active  ? 'bg-white border-red-500 text-red-500 shadow-md shadow-red-100 scale-110'  : ''}
                ${pending ? 'bg-white border-gray-200 text-gray-300'                                   : ''}
              `}>
                {done
                  ? <i className="fa-solid fa-check text-xs" />
                  : active
                    ? <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse block" />
                    : <i className={`fa-solid ${step.icon} text-xs`} />
                }
              </div>
              {!isLast && (
                <div className={`w-0.5 flex-1 min-h-6 my-1 transition-colors ${done ? 'bg-red-300' : 'bg-gray-100'}`} />
              )}
            </div>

            {/* Content */}
            <div className={`pb-5 pt-1.5 flex-1 ${isLast ? 'pb-0' : ''}`}>
              <p className={`font-semibold text-sm leading-none flex items-center gap-2 flex-wrap
                ${done    ? 'text-gray-700' : ''}
                ${active  ? 'text-red-500'  : ''}
                ${pending ? 'text-gray-300' : ''}
              `}>
                {step.label}
                {active && (
                  <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-normal
                                   flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    Hiện tại
                  </span>
                )}
              </p>
              {(done || active) && (
                <p className={`text-xs mt-1 ${done ? 'text-gray-400' : 'text-red-400'}`}>
                  {step.desc}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Result card ──────────────────────────────────────────────────────────────
function ResultCard({ data }) {
  const typeMeta   = TYPE_META[data.type] ?? TYPE_META.WARRANTY
  const currentIdx = WARRANTY_STEPS.findIndex(s => s.key === data.status)
  const progress   = Math.round(((currentIdx + 1) / WARRANTY_STEPS.length) * 100)

  return (
    <div className="space-y-4 mt-6">

      {/* Summary */}
      <div className="card overflow-hidden">
        {/* Progress bar top */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-red-500 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Mã yêu cầu</p>
              <p className="text-xl font-bold text-gray-800 font-mono tracking-wider">
                {data.requestCode}
              </p>
            </div>
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${typeMeta.color}`}>
              <i className={`fa-solid ${typeMeta.icon}`} />
              {typeMeta.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Sản phẩm</p>
              <p className="font-semibold text-gray-800 line-clamp-1">{data.productName ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Số serial</p>
              <p className="font-mono text-gray-800 text-xs bg-gray-100 inline-block px-2 py-0.5 rounded">
                {data.serialNumber ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Ngày tiếp nhận</p>
              <p className="text-gray-700">{fmt(data.createdAt)}</p>
            </div>
            {data.expectedReturnDate && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Dự kiến trả</p>
                <p className="font-semibold text-red-500">{fmt(data.expectedReturnDate)}</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>{currentIdx + 1} / {WARRANTY_STEPS.length} bước</span>
            <span className="font-semibold text-red-500">{progress}% hoàn tất</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-700 mb-5 flex items-center gap-2">
          <i className="fa-solid fa-timeline text-gray-400" />
          Tiến trình xử lý
        </h3>
        <WarrantyTimeline status={data.status} />
      </div>

      {/* Public note */}
      {data.publicNote && (
        <div className="card p-4 bg-blue-50 border border-blue-100 flex gap-3">
          <i className="fa-solid fa-comment-dots text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-800 text-sm mb-1">Ghi chú từ kỹ thuật viên</p>
            <p className="text-blue-700 text-sm leading-relaxed">{data.publicNote}</p>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="text-center py-2 text-sm text-gray-400">
        Cần hỗ trợ thêm?{' '}
        <a href="tel:1900xxxx" className="text-red-500 hover:underline font-medium">
          Gọi 1900-xxxx
        </a>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function WarrantyPage() {
  const { code: paramCode }  = useParams()
  const [code, setCode]      = useState(paramCode ?? '')
  const [result, setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]    = useState('')
  const [searched, setSearched] = useState(false)

  // Auto-search nếu có code từ URL (/warranty/WR-xxx)
  useEffect(() => {
    if (paramCode) doSearch(paramCode)
  }, [paramCode])

  const doSearch = async (q) => {
    const query = (q ?? code).trim()
    if (!query) return
    setLoading(true)
    setError('')
    setResult(null)
    setSearched(true)
    try {
      const res = await warrantyAPI.lookup(query)
      setResult(res.data)
    } catch {
      setError('Không tìm thấy yêu cầu bảo hành. Vui lòng kiểm tra lại mã hoặc số serial.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* Hero */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-shield-halved text-3xl text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Tra cứu bảo hành</h1>
        <p className="text-sm text-gray-400 mt-2 leading-relaxed">
          Nhập mã yêu cầu{' '}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">WR-XXXXXXXX</code>
          {' '}hoặc số serial sản phẩm
        </p>
      </div>

      {/* Search box */}
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
          onKeyDown={e => e.key === 'Enter' && doSearch()}
          placeholder="VD: WR-20240001 hoặc SN123456789"
          className="input flex-1 font-mono uppercase placeholder:normal-case placeholder:font-sans"
        />
        <button
          onClick={() => doSearch()}
          disabled={loading || !code.trim()}
          className="btn-primary px-5 py-2.5 flex items-center gap-2 flex-shrink-0"
        >
          {loading
            ? <i className="fa-solid fa-spinner fa-spin" />
            : <i className="fa-solid fa-magnifying-glass" />
          }
          Tra cứu
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <i className="fa-solid fa-circle-exclamation text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700">{error}</p>
            <p className="text-xs text-red-400 mt-0.5">
              Kiểm tra lại mã hoặc liên hệ{' '}
              <a href="tel:1900xxxx" className="underline">1900-xxxx</a>
            </p>
          </div>
        </div>
      )}

      {/* Result */}
      {result && <ResultCard data={result} />}

      {/* Tips — chỉ hiện khi chưa search */}
      {!searched && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              icon: 'fa-envelope',
              color: 'text-blue-500 bg-blue-50',
              title: 'Mã yêu cầu',
              desc: 'Có trong email xác nhận yêu cầu bảo hành'
            },
            {
              icon: 'fa-barcode',
              color: 'text-purple-500 bg-purple-50',
              title: 'Số serial',
              desc: 'In trên thân máy hoặc hộp sản phẩm'
            },
            {
              icon: 'fa-headset',
              color: 'text-red-500 bg-red-50',
              title: 'Hỗ trợ trực tiếp',
              desc: 'Gọi 1900-xxxx (8h–21h mỗi ngày)'
            },
          ].map(tip => (
            <div key={tip.title} className="card p-4 text-center">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${tip.color}`}>
                <i className={`fa-solid ${tip.icon}`} />
              </div>
              <p className="font-semibold text-gray-700 text-sm">{tip.title}</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{tip.desc}</p>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
