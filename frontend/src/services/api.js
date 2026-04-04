import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Auto refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, null, {
          params: { refreshToken }
        })
        localStorage.setItem('accessToken', data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ── Auth ─────────────────────────────────────────────────────────
export const authAPI = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
}

// ── Products ─────────────────────────────────────────────────────
export const productAPI = {
  getAll:    (params) => api.get('/products', { params }),
  getById:   (id)     => api.get(`/products/${id}`),
  getBySlug: (slug)   => api.get(`/products/slug/${slug}`),
  create: (formData)  => api.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, formData) => api.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/products/${id}`),
}

// ── Categories ───────────────────────────────────────────────────
export const categoryAPI = {
  getAll: () => api.get('/categories'),
}

// ── Cart ─────────────────────────────────────────────────────────
export const cartAPI = {
  getCart:    ()                => api.get('/cart'),
  addItem:    (data)            => api.post('/cart/items', data),
  updateItem: (productId, qty)  => api.put(`/cart/items/${productId}`, null, { params: { quantity: qty } }),
  removeItem: (productId)       => api.delete(`/cart/items/${productId}`),
  clearCart:  ()                => api.delete('/cart'),
}

// ── Orders ───────────────────────────────────────────────────────
export const orderAPI = {
  create:       (data)         => api.post('/orders', data),
  getMyOrders:  (params)       => api.get('/orders', { params }),
  getById:      (id)           => api.get(`/orders/${id}`),
  getAllOrders:  (params)       => api.get('/orders/admin/all', { params }),
  updateStatus: (id, status)   => api.put(`/orders/admin/${id}/status`, null, { params: { status } }),
}

// ── Payment ──────────────────────────────────────────────────────
export const paymentAPI = {
  createVNPay: (orderId) => api.post('/payment/create-payment', { orderId }),
}

// ── Admin ────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard: ()       => api.get('/admin/dashboard'),
  getUsers:     (params) => api.get('/admin/users', { params }),
  toggleUser:   (id)     => api.put(`/admin/users/${id}/toggle-status`),
}

export const userAPI = {
  getProfile:     ()     => api.get('/user/profile'),
  updateProfile:  (data) => api.put('/user/profile', data),
  changePassword: (data) => api.put('/user/change-password', data),
}