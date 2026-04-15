import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

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

export const authAPI = {
  login:     (data)  => api.post('/auth/login', data),
  register:  (data)  => api.post('/auth/register', data),
  sendOtp:   (email) => api.post('/auth/send-otp', { email }),
  verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
}

export const productAPI = {
  getAll:     (params)       => api.get('/products', { params }),
  getById:    (id)           => api.get(`/products/${id}`),
  getReviews: (productId, params) => api.get(`/products/${productId}/reviews`, { params }),
  getBySlug:  (slug)         => api.get(`/products/slug/${slug}`),
  create:     (formData)     => api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:     (id, formData) => api.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:     (id)           => api.delete(`/products/${id}`),
}

export const categoryAPI = {
  getAll: () => api.get('/categories'),
  create: (fd) => api.post('/categories', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, fd) => api.put(`/categories/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/categories/${id}`),
}

export const cartAPI = {
  getCart:    ()               => api.get('/cart'),
  addItem:    (data)           => api.post('/cart/items', data),
  updateItem: (productId, qty) => api.put(`/cart/items/${productId}`, null, { params: { quantity: qty } }),
  removeItem: (productId)      => api.delete(`/cart/items/${productId}`),
  clearCart:  ()               => api.delete('/cart'),
}

export const orderAPI = {
  create:       (data)       => api.post('/orders', data),
  getMyOrders:  (params)     => api.get('/orders', { params }),
  getById:      (id)         => api.get(`/orders/${id}`),
  getAllOrders:  (params)     => api.get('/orders/admin/all', { params }),
  updateStatus: (id, status) => api.put(`/orders/admin/${id}/status`, null, { params: { status } }),
}

export const paymentAPI = {
  createVNPay: (orderId) => api.post('/payment/create-payment', { orderId }),
}

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

export const variantAPI = {
  getByProduct: (productId)     => api.get(`/products/${productId}`),
  save:         (productId, fd) => api.post(`/products/${productId}/variants`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteAll:    (productId)     => api.delete(`/products/${productId}/variants`),
}

export const searchAPI = {
  getSuggestions: ()             => api.get('/search/suggestions'),
  search:         (q, size = 8)  => api.get('/search', { params: { q, size } }),
}

export const warrantyAPI = {
  create:      (data)     => api.post('/warranty', data),
  getMyList:   (params)   => api.get('/warranty/my', { params }),
  lookup:      (code)     => api.get(`/warranty/lookup/${code}`),
  adminList:   (params)   => api.get('/warranty/admin', { params }),
  adminUpdate: (id, data) => api.put(`/warranty/admin/${id}`, data),
}

// ── Coupons ──────────────────────────────────────────────────────
export const couponAPI = {
  apply:       (code, orderTotal) => api.get('/coupons/apply', { params: { code, orderTotal } }),
  adminList:   (params)    => api.get('/coupons/admin', { params }),
  adminCreate: (data)      => api.post('/coupons/admin', data),
  adminUpdate: (id, data)  => api.put(`/coupons/admin/${id}`, data),
  adminDelete: (id)        => api.delete(`/coupons/admin/${id}`),
}

// ── Inventory ────────────────────────────────────────────────────
export const inventoryAPI = {
  listAll:        (params)           => api.get('/inventory', { params }),
  listByProduct:  (productId, params) => api.get(`/inventory/product/${productId}`, { params }),
  addTransaction: (data)             => api.post('/inventory', data),
}