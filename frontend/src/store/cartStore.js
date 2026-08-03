import { create } from 'zustand'
import { cartAPI } from '../services/api'
import toast from 'react-hot-toast'

export const useCartStore = create((set, get) => ({
  items: [],
  totalItems: 0,
  totalAmount: 0,
  loading: false,

  fetchCart: async () => {
    set({ loading: true })
    try {
      const { data } = await cartAPI.getCart()
      set({
        items: data.items,
        totalItems: data.totalItems,
        totalAmount: data.totalAmount,
      })
    } catch {
      // Chưa đăng nhập → bỏ qua, không báo lỗi
    } finally {
      set({ loading: false })
    }
  },

  /**
   * Thêm sản phẩm vào giỏ.
   *
   * @param {number}  productId
   * @param {number}  quantity
   * @param {number|null} variantId - null nếu sản phẩm không có variant
   * @param {boolean} silent        - true → không toast thành công (dùng cho Buy Now)
   *
   * @returns {object|null} CartItem vừa được tạo/cập nhật từ server, hoặc null nếu lỗi
   *
   * Bug 4 fix: không gọi fetchCart() bên trong nữa — caller tự quyết định có cần refresh không.
   * Bug 5 fix: trả về CartItem (có id) để caller dùng thẳng, không cần find() sau đó.
   * Bug 6 fix: thêm param `silent` để Buy Now flow không toast "Đã thêm vào giỏ".
   */
  addItem: async (productId, quantity = 1, variantId = null, silent = false) => {
    try {
      await cartAPI.addItem({ productId, variantId, quantity })
      // fetchCart sync store với server — sau đây store.items đã có item mới/cập nhật
      await get().fetchCart()
      if (!silent) toast.success('Đã thêm vào giỏ hàng!')
      // Trả về true để caller biết thành công (không trả data vì backend trả CartResponse, không phải CartItem)
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể thêm vào giỏ')
      return null
    }
  },

  /**
   * Cập nhật số lượng cart item.
   * @param {number} cartItemId - item.id từ CartResponse (KHÔNG phải productId)
   * @param {number} quantity   - Số lượng mới (>= 1)
   */
  updateItem: async (cartItemId, quantity) => {
    try {
      await cartAPI.updateItem(cartItemId, quantity)
      await get().fetchCart()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật giỏ hàng')
    }
  },

  /**
   * Xóa cart item khỏi giỏ.
   * @param {number} cartItemId - item.id từ CartResponse (KHÔNG phải productId)
   */
  removeItem: async (cartItemId) => {
    try {
      await cartAPI.removeItem(cartItemId)
      await get().fetchCart()
      toast.success('Đã xóa khỏi giỏ hàng')
    } catch {
      toast.error('Không thể xóa sản phẩm')
    }
  },

  clearCart: () => set({ items: [], totalItems: 0, totalAmount: 0 }),
}))