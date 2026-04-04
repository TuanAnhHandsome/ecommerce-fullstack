import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await authAPI.login({ email, password })
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        // Set state đồng bộ trước khi navigate
        set({ user: data.user, isAuthenticated: true })
        return data.user
      },

      register: async (formData) => {
        const { data } = await authAPI.register(formData)
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        set({ user: data.user, isAuthenticated: true })
        return data.user
      },

      logout: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({ user: null, isAuthenticated: false })
      },

      isAdmin: () => get().user?.role === 'ADMIN',

      updateUser: (data) => set((state) => ({
        user: { ...state.user, ...data }
      })),
    }),
  )
)