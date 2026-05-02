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
   * @param {number} productId
   * @param {number} quantity
   * @param {number|null} variantId - null nếu sản phẩm không có variant
   */
  addItem: async (productId, quantity = 1, variantId = null) => {
    try {
      await cartAPI.addItem({ productId, variantId, quantity })
      await get().fetchCart()
      toast.success('Đã thêm vào giỏ hàng!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể thêm vào giỏ')
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