import { useState, useRef } from 'react'
import toast from 'react-hot-toast'

// ── Helpers ───────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'eshop-settings'

const DEFAULT_SETTINGS = {
  name:       '',
  tagline:    '',
  phone:      '',
  email:      '',
  address:    '',
  city:       '',
  taxCode:    '',
  website:    '',
  facebook:   '',
  zalo:       '',
  logoUrl:    '/logo.jpg',
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ icon, title, desc, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
          <i className={`fa-solid ${icon} text-indigo-500 text-sm`}></i>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{title}</p>
          {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ── Input field ───────────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1.5">
        {label}
        {hint && <span className="text-xs text-gray-400 font-normal ml-1.5">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = `w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none
  focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition placeholder:text-gray-300`

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SettingsAdminPage() {
  const [form, setForm]       = useState(loadSettings)
  const [logoPreview, setLogoPreview] = useState(form.logoUrl || null)
  const [logoFile, setLogoFile]       = useState(null)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const fileRef = useRef()

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ảnh quá lớn, tối đa 2MB')
      return
    }
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setLogoPreview(ev.target.result)
      setForm(f => ({ ...f, logoUrl: ev.target.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên cửa hàng')
      return
    }
    setSaving(true)
    try {
      // Lưu local — khi có backend thay bằng API call
      // await adminAPI.updateSettings(form)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form))

      setSaved(true)
      toast.success('Đã lưu cài đặt!')
      setTimeout(() => setSaved(false), 2500)
    } catch {
      toast.error('Không thể lưu cài đặt')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (!confirm('Đặt lại tất cả về mặc định?')) return
    setForm({ ...DEFAULT_SETTINGS })
    setLogoPreview('/logo.jpg')
    setLogoFile(null)
    localStorage.removeItem(STORAGE_KEY)
    toast.success('Đã đặt lại cài đặt')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-gear text-gray-500"></i>Cài đặt cửa hàng
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Thông tin hiển thị trên hoá đơn, email và trang web</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100
              rounded-xl transition-colors">
            Đặt lại
          </button>
          <button onClick={handleSave} disabled={saving}
            className={`px-5 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2
              disabled:opacity-60 ${saved
                ? 'bg-emerald-500 text-white'
                : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              }`}>
            {saving
              ? <><i className="fa-solid fa-spinner fa-spin"></i>Đang lưu...</>
              : saved
                ? <><i className="fa-solid fa-check"></i>Đã lưu!</>
                : <><i className="fa-solid fa-floppy-disk"></i>Lưu cài đặt</>
            }
          </button>
        </div>
      </div>

      <div className="space-y-5">

        {/* ── Logo & Tên ── */}
        <Section icon="fa-store" title="Thương hiệu"
          desc="Logo và tên cửa hàng hiển thị trên toàn hệ thống">
          <div className="flex items-start gap-6">

            {/* Logo uploader */}
            <div className="flex-shrink-0">
              <p className="text-xs font-medium text-gray-500 mb-2">Logo cửa hàng</p>
              <div
                onClick={() => fileRef.current?.click()}
                className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200
                  hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer
                  overflow-hidden relative group flex items-center justify-center bg-gray-50">
                {logoPreview
                  ? <img src={logoPreview} alt="Logo"
                      className="w-full h-full object-cover" />
                  : <div className="flex flex-col items-center gap-1 text-gray-300">
                      <i className="fa-solid fa-image text-2xl"></i>
                      <span className="text-[10px]">Tải ảnh</span>
                    </div>
                }
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100
                  transition-opacity flex items-center justify-center">
                  <i className="fa-solid fa-camera text-white text-lg"></i>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={handleLogoChange} />
              <p className="text-[10px] text-gray-400 mt-1.5 text-center">JPG, PNG · 2MB</p>
            </div>

            {/* Tên + tagline */}
            <div className="flex-1 space-y-4">
              <Field label="Tên cửa hàng" hint="*bắt buộc">
                <input className={inputCls} placeholder="VD: EShop Việt Nam"
                  value={form.name} onChange={set('name')} />
              </Field>
              <Field label="Slogan / Mô tả ngắn">
                <input className={inputCls} placeholder="VD: Điện tử chính hãng, giá tốt nhất"
                  value={form.tagline} onChange={set('tagline')} />
              </Field>
            </div>
          </div>
        </Section>

        {/* ── Liên hệ ── */}
        <Section icon="fa-address-card" title="Thông tin liên hệ"
          desc="Hiển thị trên hoá đơn và email xác nhận đơn hàng">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Số điện thoại">
              <div className="relative">
                <i className="fa-solid fa-phone absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
                <input className={inputCls + ' pl-9'} placeholder="0901 234 567"
                  value={form.phone} onChange={set('phone')} />
              </div>
            </Field>
            <Field label="Email liên hệ">
              <div className="relative">
                <i className="fa-solid fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
                <input className={inputCls + ' pl-9'} placeholder="contact@eshop.vn"
                  value={form.email} onChange={set('email')} type="email" />
              </div>
            </Field>
            <Field label="Website">
              <div className="relative">
                <i className="fa-solid fa-globe absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
                <input className={inputCls + ' pl-9'} placeholder="https://eshop.vn"
                  value={form.website} onChange={set('website')} />
              </div>
            </Field>
            <Field label="Mã số thuế">
              <div className="relative">
                <i className="fa-solid fa-building-columns absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
                <input className={inputCls + ' pl-9'} placeholder="0123456789"
                  value={form.taxCode} onChange={set('taxCode')} />
              </div>
            </Field>
          </div>
        </Section>

        {/* ── Địa chỉ ── */}
        <Section icon="fa-location-dot" title="Địa chỉ cửa hàng"
          desc="Địa chỉ kho / showroom chính">
          <div className="space-y-4">
            <Field label="Địa chỉ chi tiết">
              <div className="relative">
                <i className="fa-solid fa-map-pin absolute left-3.5 top-3 text-gray-300 text-xs"></i>
                <textarea className={inputCls + ' pl-9 resize-none'} rows={2}
                  placeholder="Số nhà, tên đường, phường/xã..."
                  value={form.address} onChange={set('address')} />
              </div>
            </Field>
            <Field label="Tỉnh / Thành phố">
              <div className="relative">
                <i className="fa-solid fa-city absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
                <input className={inputCls + ' pl-9'} placeholder="VD: Hà Nội"
                  value={form.city} onChange={set('city')} />
              </div>
            </Field>
          </div>
        </Section>

        {/* ── Mạng xã hội ── */}
        <Section icon="fa-share-nodes" title="Mạng xã hội"
          desc="Link hiển thị ở footer trang web">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Facebook">
              <div className="relative">
                <i className="fa-brands fa-facebook absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400 text-sm"></i>
                <input className={inputCls + ' pl-9'} placeholder="https://facebook.com/eshop"
                  value={form.facebook} onChange={set('facebook')} />
              </div>
            </Field>
            <Field label="Zalo">
              <div className="relative">
                <i className="fa-solid fa-comment-dots absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 text-sm"></i>
                <input className={inputCls + ' pl-9'} placeholder="Số Zalo OA hoặc link"
                  value={form.zalo} onChange={set('zalo')} />
              </div>
            </Field>
          </div>
        </Section>

        {/* ── Preview ── */}
        <Section icon="fa-eye" title="Xem trước thông tin hoá đơn"
          desc="Hiển thị trên email xác nhận đơn hàng">
          <div className="bg-gray-50 rounded-xl p-5 border border-dashed border-gray-200">
            <div className="flex items-center gap-4 pb-4 mb-4 border-b border-gray-200">
              {logoPreview && (
                <img src={logoPreview} alt="logo"
                  className="w-12 h-12 rounded-xl object-cover border border-gray-100" />
              )}
              <div>
                <p className="font-bold text-gray-800 text-base">
                  {form.name || <span className="text-gray-300">Tên cửa hàng</span>}
                </p>
                {form.tagline && (
                  <p className="text-xs text-gray-400 mt-0.5">{form.tagline}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              {form.phone && (
                <p className="flex items-center gap-1.5">
                  <i className="fa-solid fa-phone text-gray-300 w-3"></i>{form.phone}
                </p>
              )}
              {form.email && (
                <p className="flex items-center gap-1.5">
                  <i className="fa-solid fa-envelope text-gray-300 w-3"></i>{form.email}
                </p>
              )}
              {form.website && (
                <p className="flex items-center gap-1.5">
                  <i className="fa-solid fa-globe text-gray-300 w-3"></i>{form.website}
                </p>
              )}
              {form.taxCode && (
                <p className="flex items-center gap-1.5">
                  <i className="fa-solid fa-building-columns text-gray-300 w-3"></i>MST: {form.taxCode}
                </p>
              )}
              {(form.address || form.city) && (
                <p className="flex items-start gap-1.5 col-span-2">
                  <i className="fa-solid fa-map-pin text-gray-300 w-3 mt-0.5"></i>
                  {[form.address, form.city].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
            {!form.name && !form.phone && !form.email && (
              <p className="text-xs text-gray-300 text-center py-2">
                Điền thông tin bên trên để xem trước
              </p>
            )}
          </div>
        </Section>

      </div>

      {/* Sticky save bar (mobile friendly) */}
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={handleReset}
          className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
          Đặt lại
        </button>
        <button onClick={handleSave} disabled={saving}
          className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center gap-2
            disabled:opacity-60 ${saved
              ? 'bg-emerald-500 text-white'
              : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm shadow-indigo-200'
            }`}>
          {saving
            ? <><i className="fa-solid fa-spinner fa-spin"></i>Đang lưu...</>
            : saved
              ? <><i className="fa-solid fa-check"></i>Đã lưu!</>
              : <><i className="fa-solid fa-floppy-disk"></i>Lưu cài đặt</>
          }
        </button>
      </div>

    </div>
  )
}
