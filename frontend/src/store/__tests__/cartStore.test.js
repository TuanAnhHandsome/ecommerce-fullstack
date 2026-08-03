import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCartStore } from '../cartStore'
import { cartAPI } from '../../services/api'

// Mock toàn bộ module api để không gọi mạng thật trong test
vi.mock('../../services/api', () => ({
  cartAPI: {
    getCart: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
  },
}))

// Mock react-hot-toast để không đụng tới DOM thật
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

const resetStore = () => {
  useCartStore.setState({ items: [], totalItems: 0, totalAmount: 0, loading: false })
}

describe('cartStore', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  it('fetchCart cập nhật items/totalItems/totalAmount từ server', async () => {
    cartAPI.getCart.mockResolvedValue({
      data: { items: [{ id: 1, productName: 'Áo thun', subtotal: 100000 }], totalItems: 1, totalAmount: 100000 },
    })

    await useCartStore.getState().fetchCart()

    const state = useCartStore.getState()
    expect(state.items).toHaveLength(1)
    expect(state.totalItems).toBe(1)
    expect(state.totalAmount).toBe(100000)
    expect(state.loading).toBe(false)
  })

  it('fetchCart không throw khi chưa đăng nhập (401) — chỉ bỏ qua lỗi', async () => {
    cartAPI.getCart.mockRejectedValue({ response: { status: 401 } })

    await expect(useCartStore.getState().fetchCart()).resolves.toBeUndefined()
    expect(useCartStore.getState().loading).toBe(false)
  })

  it('addItem gọi API rồi tự fetchCart lại để đồng bộ với server (fix "Bug 4")', async () => {
    cartAPI.addItem.mockResolvedValue({ data: {} })
    cartAPI.getCart.mockResolvedValue({
      data: { items: [{ id: 5, productName: 'Quần jean', subtotal: 250000 }], totalItems: 1, totalAmount: 250000 },
    })

    const ok = await useCartStore.getState().addItem(10, 2, null, false)

    expect(ok).toBe(true)
    expect(cartAPI.addItem).toHaveBeenCalledWith({ productId: 10, variantId: null, quantity: 2 })
    expect(cartAPI.getCart).toHaveBeenCalledTimes(1) // đảm bảo store sync với server sau khi thêm
    expect(useCartStore.getState().items).toHaveLength(1)
  })

  it('addItem trả về null khi API lỗi, không làm crash store', async () => {
    cartAPI.addItem.mockRejectedValue({ response: { data: { message: 'Hết hàng' } } })

    const result = await useCartStore.getState().addItem(10, 1)

    expect(result).toBeNull()
  })

  it('removeItem gọi API xoá rồi refetch cart', async () => {
    cartAPI.removeItem.mockResolvedValue({ data: {} })
    cartAPI.getCart.mockResolvedValue({ data: { items: [], totalItems: 0, totalAmount: 0 } })

    await useCartStore.getState().removeItem(5)

    expect(cartAPI.removeItem).toHaveBeenCalledWith(5)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('clearCart reset state về rỗng ngay lập tức (không gọi API)', () => {
    useCartStore.setState({ items: [{ id: 1 }], totalItems: 1, totalAmount: 1000 })

    useCartStore.getState().clearCart()

    const state = useCartStore.getState()
    expect(state.items).toEqual([])
    expect(state.totalItems).toBe(0)
    expect(state.totalAmount).toBe(0)
  })
})
