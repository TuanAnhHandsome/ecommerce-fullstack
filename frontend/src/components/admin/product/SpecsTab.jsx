import { useState, useEffect } from 'react'

/**
 * SpecsTab — Quản lý thông số kỹ thuật động.
 *
 * Dữ liệu được truyền lên/xuống qua props:
 *   specs: { [group]: [{key, value, sortOrder}] }  ← từ ProductResponse (khi edit)
 *   onChange: (flatList: SpecItem[]) => void        ← gửi flat list lên ProductsAdminPage
 *
 * Flat list gửi lên có dạng: [{group, key, value, sortOrder}]
 * → khớp với ProductRequest.SpecItem
 */

// Template thông số theo danh mục — gợi ý nhanh
const SPEC_TEMPLATES = {
  'Điện thoại': [
    { group: 'Cấu hình',    rows: ['CPU', 'RAM', 'Bộ nhớ trong', 'HĐH'] },
    { group: 'Màn hình',    rows: ['Kích thước', 'Độ phân giải', 'Tần số quét', 'Công nghệ'] },
    { group: 'Camera',      rows: ['Camera sau', 'Camera trước', 'Tính năng'] },
    { group: 'Pin & Sạc',   rows: ['Dung lượng pin', 'Công suất sạc', 'Sạc không dây'] },
    { group: 'Kết nối',     rows: ['5G', 'Wifi', 'Bluetooth', 'NFC', 'Cổng sạc'] },
  ],
  'Laptop': [
    { group: 'Cấu hình',    rows: ['CPU', 'RAM', 'Ổ cứng', 'GPU', 'HĐH'] },
    { group: 'Màn hình',    rows: ['Kích thước', 'Độ phân giải', 'Tần số quét', 'Tấm nền'] },
    { group: 'Pin & Sạc',   rows: ['Dung lượng pin', 'Công suất adapter'] },
    { group: 'Kết nối',     rows: ['Wifi', 'Bluetooth', 'Cổng', 'Webcam'] },
    { group: 'Thiết kế',    rows: ['Kích thước', 'Trọng lượng', 'Vỏ máy'] },
  ],
  'Tivi': [
    { group: 'Màn hình',    rows: ['Kích thước', 'Công nghệ', 'Độ phân giải', 'Tần số quét', 'HDR'] },
    { group: 'Hệ điều hành', rows: ['HĐH', 'Bộ xử lý', 'RAM', 'Bộ nhớ trong'] },
    { group: 'Kết nối',     rows: ['HDMI', 'USB', 'Wifi', 'Bluetooth'] },
    { group: 'Âm thanh',    rows: ['Công suất loa', 'Dolby Atmos', 'DTS'] },
  ],
  'Tủ lạnh': [
    { group: 'Thông số chính', rows: ['Dung tích tổng', 'Dung tích ngăn đông', 'Loại tủ'] },
    { group: 'Công nghệ',    rows: ['Inverter', 'Làm lạnh', 'Khử mùi'] },
    { group: 'Tiết kiệm điện', rows: ['Công suất tiêu thụ', 'Cấp tiết kiệm điện'] },
    { group: 'Kích thước',   rows: ['Rộng x Sâu x Cao (cm)', 'Khối lượng (kg)'] },
  ],
  'Máy giặt': [
    { group: 'Thông số chính', rows: ['Khối lượng giặt tối đa', 'Loại máy giặt'] },
    { group: 'Tính năng',    rows: ['Số chương trình giặt', 'Tốc độ vắt', 'Chế độ giặt đặc biệt'] },
    { group: 'Tiết kiệm điện', rows: ['Công suất', 'Cấp tiết kiệm điện'] },
  ],
}

const genId = () => `_${Math.random().toString(36).slice(2, 9)}`

function buildStateFromResponse(specsMap) {
  // specsMap: { "Cấu hình": [{key,value,sortOrder}], ... }
  if (!specsMap || Object.keys(specsMap).length === 0) return []
  return Object.entries(specsMap).map(([group, rows]) => ({
    _id: genId(),
    group,
    rows: rows.map(r => ({ _id: genId(), key: r.key, value: r.value })),
  }))
}

function buildFlatList(groups) {
  const flat = []
  groups.forEach(g => {
    g.rows.forEach((r, i) => {
      if (!r.key.trim() && !r.value.trim()) return
      flat.push({ group: g.group.trim() || 'Thông số kỹ thuật', key: r.key.trim(), value: r.value.trim(), sortOrder: i })
    })
  })
  return flat
}

export default function SpecsTab({ existingSpecs, onChange }) {
  // groups: [{_id, group, rows: [{_id, key, value}]}]
  const [groups, setGroups] = useState(() => buildStateFromResponse(existingSpecs))
  const [showTemplates, setShowTemplates] = useState(false)

  // Đồng bộ lên parent mỗi khi groups thay đổi
  useEffect(() => {
    onChange?.(buildFlatList(groups))
  }, [groups])

  // Load lại khi existingSpecs thay đổi (mở modal sản phẩm khác)
  useEffect(() => {
    setGroups(buildStateFromResponse(existingSpecs))
  }, [existingSpecs])

  // ── Helpers: groups ──────────────────────────────────────────────────────
  const addGroup = () =>
    setGroups(g => [...g, { _id: genId(), group: '', rows: [{ _id: genId(), key: '', value: '' }] }])

  const removeGroup = (gid) =>
    setGroups(g => g.filter(gr => gr._id !== gid))

  const updateGroupName = (gid, name) =>
    setGroups(g => g.map(gr => gr._id === gid ? { ...gr, group: name } : gr))

  // ── Helpers: rows ────────────────────────────────────────────────────────
  const addRow = (gid) =>
    setGroups(g => g.map(gr =>
      gr._id === gid
        ? { ...gr, rows: [...gr.rows, { _id: genId(), key: '', value: '' }] }
        : gr
    ))

  const removeRow = (gid, rid) =>
    setGroups(g => g.map(gr =>
      gr._id === gid ? { ...gr, rows: gr.rows.filter(r => r._id !== rid) } : gr
    ))

  const updateRow = (gid, rid, field, val) =>
    setGroups(g => g.map(gr =>
      gr._id === gid
        ? { ...gr, rows: gr.rows.map(r => r._id === rid ? { ...r, [field]: val } : r) }
        : gr
    ))

  // ── Apply template ───────────────────────────────────────────────────────
  const applyTemplate = (templateKey) => {
    const tpl = SPEC_TEMPLATES[templateKey]
    if (!tpl) return
    setGroups(tpl.map(t => ({
      _id: genId(),
      group: t.group,
      rows: t.rows.map(key => ({ _id: genId(), key, value: '' })),
    })))
    setShowTemplates(false)
  }

  const totalRows = groups.reduce((acc, g) => acc + g.rows.length, 0)

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <i className="fa-solid fa-microchip text-indigo-400"></i>
            Thông số kỹ thuật
            {totalRows > 0 && (
              <span className="text-xs font-normal text-gray-400">({totalRows} thông số)</span>
            )}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Chia thành nhóm — VD: Cấu hình, Màn hình, Pin & Sạc
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {/* Template picker */}
          <div className="relative">
            <button type="button" onClick={() => setShowTemplates(s => !s)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5
                bg-indigo-50 text-indigo-600 hover:bg-indigo-100
                rounded-lg font-medium transition-colors">
              <i className="fa-solid fa-wand-magic-sparkles"></i>Dùng mẫu
            </button>
            {showTemplates && (
              <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-gray-100
                rounded-xl shadow-lg py-1 min-w-[160px]">
                {Object.keys(SPEC_TEMPLATES).map(k => (
                  <button key={k} type="button" onClick={() => applyTemplate(k)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700
                      hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                    {k}
                  </button>
                ))}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button type="button" onClick={() => { setGroups([]); setShowTemplates(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-rose-500
                      hover:bg-rose-50 transition-colors">
                    <i className="fa-solid fa-trash mr-1.5"></i>Xóa tất cả
                  </button>
                </div>
              </div>
            )}
          </div>

          <button type="button" onClick={addGroup}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5
              bg-gray-100 text-gray-600 hover:bg-gray-200
              rounded-lg font-medium transition-colors">
            <i className="fa-solid fa-plus"></i>Thêm nhóm
          </button>
        </div>
      </div>

      {/* ── Groups ── */}
      {groups.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl py-10
          flex flex-col items-center justify-center text-gray-400 gap-2">
          <i className="fa-solid fa-table-list text-2xl text-gray-200"></i>
          <p className="text-sm">Chưa có thông số</p>
          <p className="text-xs text-gray-300">Chọn "Dùng mẫu" để tạo nhanh hoặc "Thêm nhóm" để tạo thủ công</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g, gi) => (
            <div key={g._id} className="border border-gray-200 rounded-xl overflow-hidden">

              {/* Group header */}
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-b border-gray-100">
                <i className="fa-solid fa-folder text-gray-300 text-xs flex-shrink-0"></i>
                <input
                  className="flex-1 text-sm font-semibold text-gray-700 bg-transparent
                    outline-none placeholder-gray-300 min-w-0"
                  placeholder="Tên nhóm (VD: Cấu hình)"
                  value={g.group}
                  onChange={e => updateGroupName(g._id, e.target.value)}
                />
                <button type="button" onClick={() => removeGroup(g._id)}
                  className="p-1.5 text-gray-300 hover:text-rose-400 hover:bg-rose-50
                    rounded-lg transition-colors flex-shrink-0" title="Xóa nhóm">
                  <i className="fa-solid fa-trash text-xs"></i>
                </button>
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-50">
                {g.rows.map((row, ri) => (
                  <div key={row._id} className="flex items-center gap-2 px-3 py-2
                    hover:bg-gray-50 transition-colors group">

                    <span className="text-xs text-gray-300 w-4 text-center flex-shrink-0">
                      {ri + 1}
                    </span>

                    <input
                      className="w-36 flex-shrink-0 text-sm text-gray-600 font-medium
                        border-b border-transparent focus:border-indigo-300
                        bg-transparent outline-none placeholder-gray-300 py-0.5
                        transition-colors"
                      placeholder="Tên thông số"
                      value={row.key}
                      onChange={e => updateRow(g._id, row._id, 'key', e.target.value)}
                    />

                    <span className="text-gray-200 flex-shrink-0">:</span>

                    <input
                      className="flex-1 text-sm text-gray-700
                        border-b border-transparent focus:border-indigo-300
                        bg-transparent outline-none placeholder-gray-300 py-0.5
                        transition-colors min-w-0"
                      placeholder="Giá trị"
                      value={row.value}
                      onChange={e => updateRow(g._id, row._id, 'value', e.target.value)}
                    />

                    <button type="button"
                      onClick={() => removeRow(g._id, row._id)}
                      className="p-1 text-gray-200 hover:text-rose-400 transition-colors
                        flex-shrink-0 opacity-0 group-hover:opacity-100">
                      <i className="fa-solid fa-xmark text-xs"></i>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add row */}
              <button type="button" onClick={() => addRow(g._id)}
                className="w-full py-2 text-xs text-gray-400 hover:text-indigo-500
                  hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1
                  border-t border-gray-100">
                <i className="fa-solid fa-plus"></i>Thêm thông số
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preview count */}
      {totalRows > 0 && (
        <p className="text-xs text-gray-400 text-right">
          {groups.length} nhóm · {totalRows} thông số sẽ được lưu
        </p>
      )}
    </div>
  )
}
