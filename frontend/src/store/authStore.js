import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../services/api'

// Biến cờ khóa (Locking) dùng để chống gọi trùng lặp refresh token khi F5 / Double call
let isRefreshingPromise = null

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isBootstrapping: true,

      login: async (email, password) => {
        const { data } = await authAPI.login({ email, password })
        set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true })
        return data.user
      },

      register: async (formData) => {
        const { data } = await authAPI.register(formData)
        set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true })
        return data.user
      },

      logout: async () => {
        try {
          await authAPI.logout()
        } catch {
          // Bỏ qua lỗi nếu mất mạng
        } finally {
          set({ user: null, accessToken: null, isAuthenticated: false })
        }
      },

      isAdmin: () => get().user?.role === 'ADMIN',

      updateUser: (data) =>
        set((state) => ({ user: { ...state.user, ...data } })),

      /** Khôi phục phiên đăng nhập khi khởi động / reload trang */
      bootstrapSession: async () => {
        // Nếu đang có 1 request refresh đang xử lý, dùng chung kết quả đó
        if (isRefreshingPromise) {
          return isRefreshingPromise
        }

        isRefreshingPromise = (async () => {
          try {
            const { data } = await authAPI.refresh()
            set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true })
          } catch {
            set({ user: null, accessToken: null, isAuthenticated: false })
          } finally {
            set({ isBootstrapping: false })
            isRefreshingPromise = null // Mở khóa sau khi hoàn tất
          }
        })()

        return isRefreshingPromise
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
)