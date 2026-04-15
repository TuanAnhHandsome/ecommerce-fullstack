/**
 * SearchBar — Hybrid Approach
 *
 * Layer 1 – FE suggestion cache (~5ms):
 *   GET /api/search/suggestions — fetch 1 lần khi mount, lưu vào memory.
 *
 * Layer 2 – BE search (~150-300ms):
 *   GET /api/search?q=...&size=8 — debounce 300ms.
 *   AbortController hủy request cũ khi user tiếp tục gõ.
 *
 * Layer 3 – Enter / Tìm:
 *   Chuyển sang /products?search=... với full pagination.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

const fmt = (p) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND', maximumFractionDigits: 0,
  }).format(p)

function Highlight({ text = '', query = '' }) {
  if (!query) return <span>{text}</span>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx < 0) return <span>{text}</span>
  return (
    <span>
      {text.slice(0, idx)}
      <mark style={{ background: '#fef08a', color: 'inherit', borderRadius: 2, padding: 0 }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  )
}

function SectionLabel({ icon, label }) {
  return (
    <div style={{
      padding: '6px 14px 3px', fontSize: 11, fontWeight: 600,
      color: '#9ca3af', letterSpacing: '0.05em', textTransform: 'uppercase',
      display: 'flex', alignItems: 'center', gap: 5,
    }}>
      <i className={`fa-solid ${icon}`} style={{ fontSize: 10 }} /> {label}
    </div>
  )
}

export default function SearchBar({ className = '' }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [filteredSugg, setFilteredSugg] = useState([])
  const [beResults, setBeResults] = useState([])
  const [beLoading, setBeLoading] = useState(false)
  const [beError, setBeError] = useState(null)
  const [activeIdx, setActiveIdx] = useState(-1)
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const debounceRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    api.get('/search/suggestions')
      .then(({ data }) => {
        setSuggestions([
          ...(data.keywords || []).map((kw) => ({ type: 'keyword', text: kw })),
          ...(data.categories || []).map((cat) => ({ type: 'category', text: cat })),
        ])
      })
      .catch(() => { })
  }, [])

  useEffect(() => {
    const h = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false); setActiveIdx(-1)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const runSearch = useCallback(async (q) => {
    const trimmed = q.trim()
    setFilteredSugg(
      trimmed.length >= 1
        ? suggestions.filter((s) => s.text.toLowerCase().includes(trimmed.toLowerCase())).slice(0, 4)
        : []
    )
    if (trimmed.length < 2) { setBeResults([]); setBeLoading(false); return }
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    setBeLoading(true); setBeError(null)
    try {
      const { data } = await api.get('/search', {
        params: { q: trimmed, size: 8 },
        signal: abortRef.current.signal,
      })
      // PageResponse<ProductResponse> — Spring trả về field `content`
      setBeResults(data.content || data.results || [])
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return
      setBeError('Không thể kết nối. Thử lại sau.')
      setBeResults([])
    } finally {
      setBeLoading(false)
    }
  }, [suggestions])

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val); setOpen(true); setActiveIdx(-1)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(val), 300)
  }

  const allItems = [...filteredSugg, ...beResults]

  const handleKeyDown = (e) => {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, allItems.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0) {
        const item = allItems[activeIdx]
        if (item.type === 'keyword' || item.type === 'category') pickSuggestion(item)
        else goToProduct(item)
      } else submitSearch()
    } else if (e.key === 'Escape') closeDropdown()
  }

  const closeDropdown = () => { setOpen(false); setActiveIdx(-1); inputRef.current?.blur() }

  const submitSearch = () => {
    if (!query.trim()) return
    navigate(`/products?search=${encodeURIComponent(query.trim())}`)
    closeDropdown()
  }

  const pickSuggestion = (item) => {
    setQuery(item.text)
    clearTimeout(debounceRef.current)
    runSearch(item.text)
    inputRef.current?.focus()
  }

  const goToProduct = (product) => {
    // Ưu tiên slug, nếu không có thì dùng id, nhưng dùng chung một cấu trúc URL
    const identifier = product.slug || product.id;
    navigate(`/products/${identifier}`);
    closeDropdown();
  }

  const clearQuery = () => {
    setQuery(''); setBeResults([]); setFilteredSugg([]); setOpen(false)
    if (abortRef.current) abortRef.current.abort()
    inputRef.current?.focus()
  }

  const showDropdown = open && query.trim().length > 0
  const hasContent = filteredSugg.length > 0 || beResults.length > 0 || beLoading || beError
  const isDropdownOpen = showDropdown && hasContent

  return (
    <div ref={containerRef} className={className}
      style={{ position: 'relative', flex: 1, maxWidth: 520 }}>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); submitSearch() }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          border: `1.5px solid ${isDropdownOpen ? '#ef4444' : '#e5e7eb'}`,
          borderRadius: isDropdownOpen ? '12px 12px 0 0' : '12px',
          background: '#fff', overflow: 'hidden', transition: 'border-color .15s, border-radius .15s',
        }}>
          <div style={{ padding: '0 12px', color: '#9ca3af', fontSize: 13, display: 'flex', flexShrink: 0 }}>
            <i className="fa-solid fa-magnifying-glass" />
          </div>
          <input
            ref={inputRef} type="text" value={query}
            onChange={handleChange} onKeyDown={handleKeyDown}
            onFocus={() => { if (query.trim()) setOpen(true) }}
            placeholder="Tìm điện thoại, laptop, tai nghe..."
            autoComplete="off"
            style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 0', fontSize: 13.5, color: '#111827', background: 'transparent' }}
          />
          {query && (
            <button type="button" onClick={clearQuery}
              style={{ padding: '0 8px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <i className="fa-solid fa-xmark" style={{ fontSize: 13 }} />
            </button>
          )}
          <button type="submit"
            style={{ padding: '8px 18px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10 , cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0, borderLeft: '1px solid #f87171' }}>
            Tìm kiếm
          </button>
        </div>
      </form>

      {/* Dropdown */}
      {isDropdownOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
          border: '1.5px solid #ef4444', borderTop: '1px solid #fee2e2',
          borderRadius: '0 0 14px 14px', zIndex: 999,
          boxShadow: '0 12px 32px rgba(0,0,0,.10)', overflow: 'hidden',
        }}>
          {/* Suggestions */}
          {filteredSugg.length > 0 && (
            <>
              <SectionLabel icon="fa-bolt" label="Gợi ý" />
              {filteredSugg.map((item, i) => (
                <button key={`s${i}`} onMouseEnter={() => setActiveIdx(i)} onClick={() => pickSuggestion(item)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 14px', border: 'none', background: activeIdx === i ? '#fef2f2' : '#fff', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: '#374151', transition: 'background .1s' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, background: item.type === 'keyword' ? '#fef2f2' : '#eff6ff', color: item.type === 'keyword' ? '#ef4444' : '#3b82f6' }}>
                    <i className={`fa-solid ${item.type === 'keyword' ? 'fa-magnifying-glass' : 'fa-tag'}`} />
                  </div>
                  <Highlight text={item.text} query={query} />
                  {item.type === 'category' && (
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6b7280', background: '#f3f4f6', padding: '1px 7px', borderRadius: 20, flexShrink: 0 }}>danh mục</span>
                  )}
                </button>
              ))}
              {(beResults.length > 0 || beLoading) && <div style={{ height: 1, background: '#f3f4f6', margin: '2px 0' }} />}
            </>
          )}

          {/* Loading */}
          {beLoading && (
            <div style={{ padding: 14, textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }} />Đang tìm kiếm...
            </div>
          )}

          {/* Error */}
          {beError && !beLoading && (
            <div style={{ padding: '10px 14px', fontSize: 13, color: '#dc2626', background: '#fef2f2' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }} />{beError}
            </div>
          )}

          {/* Kết quả sản phẩm */}
          {!beLoading && !beError && beResults.length > 0 && (
            <>
              <SectionLabel icon="fa-box" label="Sản phẩm" />
              {beResults.map((product, i) => {
                const idx = filteredSugg.length + i
                const displayPrice = product.effectivePrice ?? product.salePrice ?? product.price
                const originalPrice = (product.salePrice && product.price > product.salePrice) ? product.price : null
                return (
                  <button key={product.id} onMouseEnter={() => setActiveIdx(idx)} onClick={() => goToProduct(product)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 14px', border: 'none', background: activeIdx === idx ? '#fef2f2' : '#fff', cursor: 'pointer', textAlign: 'left', borderTop: '1px solid #f9fafb', transition: 'background .1s' }}>
                    {/* Thumbnail */}
                    <div style={{ width: 46, height: 46, borderRadius: 8, flexShrink: 0, overflow: 'hidden', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: 16 }}>
                      {product.imageUrl
                        ? <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none' }} />
                        : <i className="fa-solid fa-box" />}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <Highlight text={product.name || ''} query={query} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {product.categoryName && (
                          <span style={{ fontSize: 11, color: '#6b7280', background: '#f3f4f6', padding: '1px 7px', borderRadius: 20 }}>{product.categoryName}</span>
                        )}
                      </div>
                    </div>
                    {/* Giá */}
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', whiteSpace: 'nowrap' }}>
                        {displayPrice != null ? fmt(displayPrice) : '—'}
                      </div>
                      {originalPrice && (
                        <div style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'line-through' }}>{fmt(originalPrice)}</div>
                      )}
                    </div>
                  </button>
                )
              })}
            </>
          )}

          {/* Empty */}
          {!beLoading && !beError && beResults.length === 0 && filteredSugg.length === 0 && (
            <div style={{ padding: '20px 16px', textAlign: 'center' }}>
              <i className="fa-solid fa-face-frown-open" style={{ fontSize: 26, color: '#d1d5db', display: 'block', marginBottom: 8 }} />
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Không tìm thấy &ldquo;{query}&rdquo;</p>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>Thử từ khóa ngắn hơn</p>
            </div>
          )}

          {/* Footer */}
          {!beLoading && (beResults.length > 0 || filteredSugg.length > 0) && (
            <button onClick={submitSearch}
              style={{ width: '100%', padding: '10px 14px', background: '#fef2f2', border: 'none', borderTop: '1px solid #fee2e2', cursor: 'pointer', fontSize: 13, color: '#ef4444', fontWeight: 600, textAlign: 'center' }}>
              <i className="fa-solid fa-arrow-right" style={{ marginRight: 6, fontSize: 11 }} />
              Xem tất cả kết quả cho &ldquo;{query}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  )
}
