import BasicInfoTab from './BasicInfoTab'
import VariantsTab from './VariantsTab'
import ImagesTab from './ImagesTab'
import SpecsTab from './SpecsTab'

function TabBtn({ active, onClick, icon, label, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2
        transition-colors whitespace-nowrap ${
        active
          ? 'border-indigo-500 text-indigo-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      <i className={`fa-solid ${icon} text-xs`}></i>
      {label}
      {badge > 0 && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
          active ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
        }`}>{badge}</span>
      )}
    </button>
  )
}

export default function ProductFormModal({
  editing,
  activeTab, setActiveTab,
  form, setForm,
  categories,
  existingImages, setExistingImages,
  newImages, setNewImages,
  deletedImageIds, setDeletedImageIds,
  specs, setSpecs,          // ← MỚI
  loading,
  onClose,
  onSubmit,
}) {
  const variantCount = editing?.variants?.length ?? 0
  const imageCount   = (existingImages.length > 0 ? 1 : 0) + (newImages.length > 0 ? 1 : 0)
  const specsCount   = specs?.length ?? 0   // flat list length

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <i className={`fa-solid ${editing
              ? 'fa-pen-to-square text-blue-500'
              : 'fa-plus text-emerald-500'}`}></i>
            {editing ? editing.name : 'Thêm sản phẩm mới'}
          </h2>
          <button onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 flex-shrink-0 overflow-x-auto">
          <TabBtn active={activeTab === 'basic'} onClick={() => setActiveTab('basic')}
            icon="fa-circle-info" label="Thông tin" />
          <TabBtn active={activeTab === 'specs'} onClick={() => setActiveTab('specs')}
            icon="fa-microchip" label="Thông số"
            badge={specsCount} />
          <TabBtn active={activeTab === 'variants'} onClick={() => setActiveTab('variants')}
            icon="fa-layer-group" label="Biến thể"
            badge={variantCount} />
          <TabBtn active={activeTab === 'images'} onClick={() => setActiveTab('images')}
            icon="fa-images" label="Hình ảnh"
            badge={imageCount} />
        </div>

        {/* Content */}
        <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5">

            {activeTab === 'basic' && (
              <BasicInfoTab form={form} setForm={setForm} categories={categories} />
            )}

            {activeTab === 'specs' && (
              <SpecsTab
                existingSpecs={editing?.specs ?? null}
                onChange={(flatList) => setSpecs(flatList)}
              />
            )}

            {activeTab === 'variants' && (
              <VariantsTab productId={editing?.id} />
            )}

            {activeTab === 'images' && (
              <ImagesTab
                productId={editing?.id}
                existingImages={existingImages}
                setExistingImages={setExistingImages}
                newImages={newImages}
                setNewImages={setNewImages}
                deletedImageIds={deletedImageIds}
                setDeletedImageIds={setDeletedImageIds}
              />
            )}
          </div>

          {/* Footer — ẩn ở tab variants vì tab đó có nút Save riêng */}
          {activeTab !== 'variants' && (
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                <i className="fa-solid fa-xmark mr-1"></i>Huỷ
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading
                  ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i>Đang lưu...</>
                  : editing
                    ? <><i className="fa-solid fa-floppy-disk mr-1"></i>Cập nhật</>
                    : <><i className="fa-solid fa-plus mr-1"></i>Thêm mới</>}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}