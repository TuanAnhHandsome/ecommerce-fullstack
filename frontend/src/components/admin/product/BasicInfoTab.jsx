import CategorySelector from './CategorySelector'

export default function BasicInfoTab({ form, setForm, categories }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
        <input required className="input" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
        <CategorySelector
          categories={categories}
          value={form.categoryId}
          onChange={(id) => setForm(f => ({ ...f, categoryId: id }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Giá gốc (đ) *</label>
          <input required type="number" min="0" className="input" value={form.price}
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Giá sale (đ)</label>
          <input type="number" min="0" className="input" value={form.salePrice}
            placeholder="Để trống nếu không giảm"
            onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho *</label>
          <input required type="number" min="0" className="input" value={form.stockQty}
            onChange={e => setForm(f => ({ ...f, stockQty: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
          <input className="input" value={form.sku}
            onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
        <textarea rows={4} className="input resize-none" value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <div className="relative">
          <input type="checkbox" className="sr-only" checked={form.active}
            onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
          <div className={`w-10 h-6 rounded-full transition-colors ${form.active ? 'bg-green-500' : 'bg-gray-300'}`} />
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-5' : 'translate-x-1'}`} />
        </div>
        <span className="text-sm font-medium text-gray-700">Hiển thị sản phẩm</span>
      </label>
    </div>
  )
}
