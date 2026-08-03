import { useState, useEffect, useRef } from 'react'

// ─────────────────────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────────────────────
const GOONG_MAPS_KEY = import.meta.env.VITE_GOONG_MAPS_KEY
const GOONG_API_KEY  = import.meta.env.VITE_GOONG_API_KEY
const GOONG_API_BASE = 'https://rsapi.goong.io'

// ─────────────────────────────────────────────────────────────
//  Cache autocomplete
// ─────────────────────────────────────────────────────────────
const autocompleteCache = new Map()

// ─────────────────────────────────────────────────────────────
//  Load Goong SDK — module-level singleton, an toàn với StrictMode
//  KHÔNG reset sdkPromise khi lỗi để tránh double-invoke của StrictMode
// ─────────────────────────────────────────────────────────────
let sdkPromise = null

function loadGoongSDK() {
  if (sdkPromise) return sdkPromise

  sdkPromise = new Promise((resolve, reject) => {
    // SDK đã có sẵn (mở modal lần 2+)
    if (window.goongjs) {
      window.goongjs.accessToken = GOONG_MAPS_KEY
      resolve(window.goongjs)
      return
    }

    // Load CSS một lần
    if (!document.querySelector('link[href*="goong-js"]')) {
      const link = document.createElement('link')
      link.rel  = 'stylesheet'
      link.href = 'https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.css'
      document.head.appendChild(link)
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.js'

    script.onload = () => {
      // ★ Set token ĐỒNG BỘ ngay trong onload, TRƯỚC resolve
      window.goongjs.accessToken = GOONG_MAPS_KEY
      resolve(window.goongjs)
    }

    script.onerror = () => {
      reject(new Error('Không thể tải Goong Maps SDK từ CDN'))
    }

    document.head.appendChild(script)
  })

  return sdkPromise
}

// ─────────────────────────────────────────────────────────────
//  API helpers
// ─────────────────────────────────────────────────────────────
async function apiAutocomplete(input) {
  const cacheKey = input.trim().toLowerCase()
  if (autocompleteCache.has(cacheKey)) return autocompleteCache.get(cacheKey)

  const params = new URLSearchParams({ input, api_key: GOONG_API_KEY })
  const res    = await fetch(`${GOONG_API_BASE}/Place/AutoComplete?${params}`)
  const data   = await res.json()
  const results = data.predictions || []

  if (autocompleteCache.size >= 100) {
    autocompleteCache.delete(autocompleteCache.keys().next().value)
  }
  autocompleteCache.set(cacheKey, results)
  return results
}

async function apiPlaceDetail(place_id) {
  const params = new URLSearchParams({ place_id, api_key: GOONG_API_KEY })
  const res    = await fetch(`${GOONG_API_BASE}/Place/Detail?${params}`)
  const data   = await res.json()
  return data.result?.geometry?.location || null
}

async function apiReverseGeocode(lat, lng) {
  const params = new URLSearchParams({ latlng: `${lat},${lng}`, api_key: GOONG_API_KEY })
  const res    = await fetch(`${GOONG_API_BASE}/Geocode/reverse?${params}`)
  const data   = await res.json()
  return data.results?.[0]?.formatted_address || null
}

// ─────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────
export default function AddressPickerModal({ onConfirm, onCancel, initialValue = '' }) {
  const mapContainerRef = useRef(null)
  const mapRef          = useRef(null)
  const markerRef       = useRef(null)
  const debounceRef     = useRef(null)
  const inputRef        = useRef(null)
  const lastLatLngRef   = useRef(null)
  // ★ Guard chống StrictMode double-invoke: chỉ init map 1 lần
  const initCalledRef   = useRef(false)

  const [sdkReady,        setSdkReady]        = useState(false)
  const [sdkError,        setSdkError]        = useState(null)
  const [query,           setQuery]           = useState(initialValue)
  const [suggestions,     setSuggestions]     = useState([])
  const [showDropdown,    setShowDropdown]    = useState(false)
  const [loadingSuggest,  setLoadingSuggest]  = useState(false)
  const [reverseLoading,  setReverseLoading]  = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(initialValue)

  // ── Khởi tạo map ──────────────────────────────────────────
  useEffect(() => {
    // StrictMode gọi 2 lần — ref này đảm bảo chỉ init 1 lần thật sự
    if (initCalledRef.current) return
    initCalledRef.current = true

    loadGoongSDK()
      .then((goongjs) => {
        if (!mapContainerRef.current || mapRef.current) return

        const map = new goongjs.Map({
          container: mapContainerRef.current,
          style: 'https://tiles.goong.io/assets/goong_map_web.json',
          center: [105.8342, 21.0278], // Hà Nội
          zoom: 5,
        })

        map.addControl(new goongjs.NavigationControl(), 'bottom-right')

        map.on('click', async (e) => {
          const { lat, lng } = e.lngLat

          // Bỏ qua nếu click cùng vị trí (~10m)
          if (lastLatLngRef.current) {
            const p = lastLatLngRef.current
            if (Math.abs(p.lat - lat) < 0.0001 && Math.abs(p.lng - lng) < 0.0001) return
          }
          lastLatLngRef.current = { lat, lng }

          placeOrMoveMarker(goongjs, map, lng, lat)
          setReverseLoading(true)
          const address = await apiReverseGeocode(lat, lng).catch(() => null)
          setReverseLoading(false)
          if (address) {
            setQuery(address)
            setSelectedAddress(address)
          }
        })

        mapRef.current = map
        setSdkReady(true)
      })
      .catch((err) => {
        setSdkError(err.message)
      })

    return () => {
      // Cleanup map khi unmount thật (không phải StrictMode unmount)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  const placeOrMoveMarker = (goongjs, map, lng, lat) => {
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat])
    } else {
      markerRef.current = new goongjs.Marker({ color: '#ef4444' })
        .setLngLat([lng, lat])
        .addTo(map)
    }
    map.flyTo({ center: [lng, lat], zoom: 16, duration: 700 })
  }

  // ── Autocomplete debounce 500ms ───────────────────────────
  const handleQueryChange = (e) => {
    const val = e.target.value
    setQuery(val)
    setSelectedAddress(val)
    clearTimeout(debounceRef.current)

    if (val.trim().length < 3) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoadingSuggest(true)
      try {
        const results = await apiAutocomplete(val.trim())
        setSuggestions(results)
        setShowDropdown(results.length > 0)
      } catch {
        setSuggestions([])
      } finally {
        setLoadingSuggest(false)
      }
    }, 500)
  }

  // ── Chọn gợi ý ───────────────────────────────────────────
  const handleSelectSuggestion = async (item) => {
    setShowDropdown(false)
    setSuggestions([])
    const address = item.description
    setQuery(address)
    setSelectedAddress(address)

    if (!mapRef.current) return
    const loc = await apiPlaceDetail(item.place_id).catch(() => null)
    if (loc) {
      lastLatLngRef.current = { lat: loc.lat, lng: loc.lng }
      placeOrMoveMarker(window.goongjs, mapRef.current, loc.lng, loc.lat)
    }
  }

  // ── Đóng dropdown khi click ra ngoài ─────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!inputRef.current?.closest('.apicker-search')?.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleConfirm = () => {
    if (selectedAddress.trim()) onConfirm(selectedAddress.trim())
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-map-location-dot text-red-500" />
            <h3 className="font-bold text-gray-800 text-base">Chọn địa chỉ</h3>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3 p-5 overflow-y-auto flex-1">

          {/* Search */}
          <div className="apicker-search relative">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
              {loadingSuggest && (
                <i className="fa-solid fa-spinner fa-spin absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
              )}
              <input
                ref={inputRef}
                type="text"
                className="input pl-9 pr-9 text-sm"
                placeholder="Nhập tên đường, phường, quận... (≥ 3 ký tự)"
                value={query}
                onChange={handleQueryChange}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                autoComplete="off"
              />
            </div>

            {showDropdown && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-[10000] overflow-hidden">
                {suggestions.map((item) => (
                  <button
                    key={item.place_id}
                    type="button"
                    onMouseDown={() => handleSelectSuggestion(item)}
                    className="w-full text-left px-4 py-2.5 hover:bg-red-50 transition-colors border-b border-gray-50 last:border-0 flex items-start gap-2.5"
                  >
                    <i className="fa-solid fa-location-dot text-red-400 text-xs mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-1">
                        {item.structured_formatting?.main_text || item.description.split(',')[0]}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                        {item.structured_formatting?.secondary_text || item.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hint */}
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <i className="fa-solid fa-circle-info" />
            Hoặc click trực tiếp lên bản đồ để ghim vị trí
          </p>

          {/* Map */}
          <div className="rounded-xl overflow-hidden border border-gray-200 relative" style={{ height: 240 }}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

            {!sdkReady && !sdkError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-sm gap-2">
                <i className="fa-solid fa-spinner fa-spin" /> Đang tải bản đồ...
              </div>
            )}

            {sdkError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-center p-4 gap-2">
                <i className="fa-solid fa-triangle-exclamation text-yellow-500 text-xl" />
                <p className="text-xs text-gray-500 max-w-xs">{sdkError}</p>
              </div>
            )}
          </div>

          {/* Địa chỉ đã chọn */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 min-h-[56px]">
            <p className="text-xs text-gray-400 mb-1">Địa chỉ đã chọn</p>
            {reverseLoading ? (
              <p className="text-sm text-gray-400 flex items-center gap-2">
                <i className="fa-solid fa-spinner fa-spin" /> Đang xác định địa chỉ...
              </p>
            ) : (
              <p className="text-sm font-medium text-gray-800 leading-snug">
                {selectedAddress || <span className="text-gray-400 font-normal">Chưa chọn địa chỉ</span>}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedAddress.trim() || reverseLoading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-check" /> Xác nhận
          </button>
        </div>
      </div>
    </div>
  )
}