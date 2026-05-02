import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await authAPI.login({ email, password })
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        })
        return data.user
      },

      /**
       * Register nhận thêm otp — backend verify + register trong 1 request.
       * @param {Object} formData - { fullName, email, password, phone, otp }
       */
      register: async (formData) => {
        const { data } = await authAPI.register(formData)
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        })
        return data.user
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      isAdmin: () => get().user?.role === 'ADMIN',

      updateUser: (data) =>
        set((state) => ({ user: { ...state.user, ...data } })),
    }),
    {
      name: 'auth-storage',
      // Chỉ persist những field cần thiết
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)