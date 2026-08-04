import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { productImportAPI } from '../../../services/api'
import toast from 'react-hot-toast'

/**
 * ProductImportModal — import hàng loạt sản phẩm từ file Excel.
 *
 * Luồng: chọn file → Preview (validate, không ghi DB) → xem kết quả →
 * nếu ổn thì bấm "Xác nhận import" → ghi DB thật → refresh danh sách.
 */
export default function ProductImportModal({ onClose }) {
  const queryClient = useQueryClient()
  const fileRef = useRef(null)

  const [file, setFile] = useState(null)
  const [step, setStep] = useState('pick')       // 'pick' | 'preview' | 'done'
  const [result, setResult] = useState(null)      // ImportResultResponse
  const [loading, setLoading] = useState(false)

  const handleDownloadTemplate = async () => {
    try {
      const res = await productImportAPI.downloadTemplate()
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'mau-import-san-pham.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Không tải được file mẫu')
    }
  }

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setStep('pick')
  }

  const handlePreview = async () => {
    if (!file) return
    setLoading(true)
    try {
      const { data } = await productImportAPI.preview(file)
      setResult(data)
      setStep('preview')
      if (data.errorCount > 0) {
        toast.error(`${data.errorCount} dòng có lỗi — kiểm tra trước khi import`)
      } else {
        toast.success(`${data.successCount} sản phẩm hợp lệ, sẵn sàng import`)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không đọc được file')
    } finally {
      setLoading(false)
    }
  }

  const handleCommit = async () => {
    if (!file) return
    setLoading(true)
    try {
      const { data } = await productImportAPI.commit(file)
      setResult(data)
      setStep('done')
      queryClient.invalidateQueries(['admin-products'])
      toast.success(`Đã import ${data.successCount}/${data.totalGroups} sản phẩm`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-file-excel text-emerald-500"></i>
            Import hàng loạt sản phẩm
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Bước 0: tải mẫu */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-700">Chưa có file mẫu?</p>
              <p className="text-xs text-indigo-500 mt-0.5">Tải template kèm sẵn danh mục hiện có và ví dụ</p>
            </div>
            <button type="button" onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 text-xs px-3 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-100 transition-colors border border-indigo-200">
              <i className="fa-solid fa-download"></i>Tải mẫu
            </button>
          </div>

          {/* Chọn file */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">File Excel đã điền (.xlsx)</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-600 transition-colors">
                <i className="fa-solid fa-upload"></i>Chọn file
              </button>
              <span className="text-sm text-gray-500 truncate">{file?.name ?? 'Chưa chọn file nào'}</span>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
            </div>
          </div>

          {/* Kết quả preview/commit */}
          {result && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{result.successCount}</p>
                  <p className="text-xs text-emerald-500">Hợp lệ</p>
                </div>
                <div className="flex-1 bg-rose-50 border border-rose-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-rose-500">{result.errorCount}</p>
                  <p className="text-xs text-rose-400">Lỗi</p>
                </div>
                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-gray-600">{result.totalGroups}</p>
                  <p className="text-xs text-gray-400">Tổng dòng</p>
                </div>
              </div>

              {result.errors?.length > 0 && (
                <div className="border border-rose-100 rounded-xl overflow-hidden">
                  <div className="bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">Chi tiết lỗi</div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-rose-50">
                    {result.errors.map((e, i) => (
                      <div key={i} className="px-3 py-2 text-xs">
                        <span className="font-medium text-gray-600">
                          [{e.sheet} · dòng {e.rowNumber}{e.tempCode ? ` · ${e.tempCode}` : ''}]
                        </span>{' '}
                        <span className="text-rose-500">{e.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.imported?.length > 0 && (
                <div className="border border-emerald-100 rounded-xl overflow-hidden">
                  <div className="bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-600">
                    {step === 'done' ? 'Đã tạo' : 'Sẽ tạo'}
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-emerald-50">
                    {result.imported.map((it, i) => (
                      <div key={i} className="px-3 py-2 text-xs flex justify-between">
                        <span className="text-gray-700">{it.tempCode} — {it.name}</span>
                        <span className="text-gray-400">{it.variantCount > 0 ? `${it.variantCount} SKU` : 'Đơn giản'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Đóng</button>

          {step !== 'done' && (
            <button type="button" onClick={handlePreview} disabled={!file || loading}
              className="btn-secondary flex-1 disabled:opacity-50">
              {loading && step === 'pick' ? 'Đang kiểm tra...' : 'Xem trước'}
            </button>
          )}

          {step === 'preview' && result?.errorCount === 0 && (
            <button type="button" onClick={handleCommit} disabled={loading} className="btn-primary flex-1">
              {loading ? 'Đang import...' : `Xác nhận import (${result.successCount})`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
