import axios from 'axios'
// NOTE: import này tạo một dependency cycle với authStore.js (authStore.js import
// `authAPI` từ file này). Đây là cycle AN TOÀN vì cả 2 phía chỉ dùng biến import
// bên trong function body (chạy sau khi mọi module đã load xong), không dùng ở
// top-level của module — nên không gặp lỗi "Cannot access before initialization".
import { useAuthStore } from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  // BẮT BUỘC để trình duyệt gửi/nhận cookie `refreshToken` (httpOnly) — nếu thiếu
  // dòng này, cookie Set-Cookie từ backend sẽ bị trình duyệt âm thầm bỏ qua.
  withCredentials: true,
})

// ── Request interceptor: đính token ──────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: auto refresh token ─────────────────────
// Không còn tự tay đọc/gửi refreshToken nữa — nó nằm trong cookie httpOnly,
// trình duyệt tự đính kèm khi gọi /auth/refresh (nhờ withCredentials: true ở trên).
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry
        && !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true
      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, null, { withCredentials: true })

        useAuthStore.setState({ accessToken: data.accessToken, user: data.user, isAuthenticated: true })

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch {
        useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  sendOtp: (email) => api.post('/auth/send-otp', { email }),
  verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  // Không còn nhận param refreshToken — cookie httpOnly được browser tự gửi kèm.
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
}

// ── Products ──────────────────────────────────────────────────────
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getReviews: (productId, params) => api.get(`/products/${productId}/reviews`, { params }),
  getBySlug: (slug) => api.get(`/products/slug/${slug}`),
  create: (formData) => api.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/products/${id}`),
  toggleActive: (id, active) => api.patch(`/products/${id}/active`, null, {
    params: { active },
  }),
}

// ── Categories ────────────────────────────────────────────────────
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  create: (fd) => api.post('/categories', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, fd) => api.put(`/categories/${id}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/categories/${id}`),
}

// ── Cart ──────────────────────────────────────────────────────────
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addItem: (data) => api.post('/cart/items', data),
  updateItem: (cartItemId, qty) => api.put(`/cart/items/${cartItemId}`, null, {
    params: { quantity: qty },
  }),
  removeItem: (cartItemId) => api.delete(`/cart/items/${cartItemId}`),
  clearCart: () => api.delete('/cart'),
}

// ── Orders ────────────────────────────────────────────────────────
export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  getAllOrders: (params) => api.get('/orders/admin/all', { params }),
  updateStatus: (id, status) => api.put(`/orders/admin/${id}/status`, null, {
    params: { status },
  }),
  cancel: (id, reason) => api.put(`/orders/${id}/cancel`, null, {
    params: { reason },
  }),
}

// ── Payment ───────────────────────────────────────────────────────
export const paymentAPI = {
  createVNPay: (orderId) => api.post('/payment/create-payment', { orderId }),
}

// ── Admin ─────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle-status`),
}

// ── User profile ──────────────────────────────────────────────────
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  changePassword: (data) => api.put('/user/change-password', data),
  verifyPassword: (data) => api.post('/user/verify-password', data),
  uploadAvatar: (formData) => api.post('/user/avatar', formData, {
    headers: { 'Content-Type': undefined }   // reset về undefined → axios tự set multipart + boundary
  }),
  deleteAvatar: () => api.delete('/user/avatar'),
}

// ── Variants ──────────────────────────────────────────────────────
export const variantAPI = {
  getByProduct: (productId) => api.get(`/products/${productId}`),
  save: (productId, fd) => api.post(`/products/${productId}/variants`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteAll: (productId) => api.delete(`/products/${productId}/variants`),
}

// ── Search ────────────────────────────────────────────────────────
export const searchAPI = {
  getSuggestions: () => api.get('/search/suggestions'),
  search: (q, size = 8) => api.get('/search', { params: { q, size } }),
}

// ── Warranty ──────────────────────────────────────────────────────
export const warrantyAPI = {
  // Tạo yêu cầu — body có thể chứa orderId (từ OrderDetailPage)
  // hoặc orderCode (từ form standalone)
  create: (data) => api.post('/warranty', data),
  getMyList: (params) => api.get('/warranty/my', { params }),
  lookup: (code) => api.get(`/warranty/lookup/${code}`),
  adminList: (params) => api.get('/warranty/admin', { params }),
  adminUpdate: (id, data) => api.put(`/warranty/admin/${id}`, data),
}

// ── Coupons ───────────────────────────────────────────────────────
export const couponAPI = {
  apply: (code, orderTotal) => api.get('/coupons/apply', {
    params: { code, orderTotal },
  }),
  adminList: (params) => api.get('/coupons/admin', { params }),
  adminCreate: (data) => api.post('/coupons/admin', data),
  adminUpdate: (id, data) => api.put(`/coupons/admin/${id}`, data),
  adminDelete: (id) => api.delete(`/coupons/admin/${id}`),
}

// ── Inventory ─────────────────────────────────────────────────────
export const inventoryAPI = {
  listAll: (params) => api.get('/inventory', { params }),
  listByProduct: (productId, params) => api.get(`/inventory/product/${productId}`, { params }),
  addTransaction: (data) => api.post('/inventory', data),
}

// ── Reviews ───────────────────────────────────────────────────────
export const reviewAPI = {
  // Lấy danh sách review của product (public)
  getByProduct: (productId, params) =>
    api.get(`/products/${productId}/reviews`, { params }),

  // Tạo review — gửi multipart/form-data vì có ảnh
  create: (productId, formData) =>
    api.post(`/products/${productId}/reviews`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Xoá review của mình
  delete: (productId, reviewId) =>
    api.delete(`/products/${productId}/reviews/${reviewId}`),

  // Lấy Set<productId> đã review trong 1 order
  // Dùng ở OrderDetailPage để hiện badge "Đã đánh giá"
  getReviewedProducts: (orderId) =>
    api.get(`/orders/${orderId}/reviews/reviewed-products`),
}

// ── Returns ───────────────────────────────────────────────────────
export const returnAPI = {
  // Khách tạo yêu cầu hoàn hàng (chỉ cho đơn DELIVERED)
  create: (data) => api.post('/returns', data),

  // Khách xem danh sách yêu cầu của mình
  getMyList: (params) => api.get('/returns/my', { params }),

  // Khách xem chi tiết 1 yêu cầu
  getById: (id) => api.get(`/returns/${id}`),

  // Admin
  adminList: (params) => api.get('/returns/admin', { params }),
  adminUpdate: (id, data) => api.put(`/returns/admin/${id}`, data),
}