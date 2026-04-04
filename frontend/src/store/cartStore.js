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
      set({ items: data.items, totalItems: data.totalItems, totalAmount: data.totalAmount })
    } catch {
      // chưa đăng nhập thì bỏ qua
    } finally {
      set({ loading: false })
    }
  },

  addItem: async (productId, quantity = 1) => {
    try {
      await cartAPI.addItem({ productId, quantity })
      await get().fetchCart()
      toast.success('Đã thêm vào giỏ hàng!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể thêm vào giỏ')
    }
  },

  updateItem: async (productId, quantity) => {
    try {
      await cartAPI.updateItem(productId, quantity)
      await get().fetchCart()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật giỏ hàng')
    }
  },

  removeItem: async (productId) => {
    try {
      await cartAPI.removeItem(productId)
      await get().fetchCart()
      toast.success('Đã xoá khỏi giỏ hàng')
    } catch {
      toast.error('Không thể xoá sản phẩm')
    }
  },

  clearCart: () => set({ items: [], totalItems: 0, totalAmount: 0 }),
}))