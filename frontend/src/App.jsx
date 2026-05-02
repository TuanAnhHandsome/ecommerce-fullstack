import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

import MainLayout from './components/common/MainLayout'
import AdminLayout from './components/admin/AdminLayout'

import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import VNPayReturnPage from './pages/VNPayReturnPage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailPage from './pages/OrderDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import NotFoundPage from './pages/NotFoundPage'
import PaymentResultPage from './pages/PaymentResultPage'
import ProfilePage from './pages/ProfilePage'
import WarrantyPage from './pages/WarrantyPage'

import DashboardPage from './pages/admin/DashboardPage'
import ProductsAdminPage from './pages/admin/ProductsAdminPage'
import OrdersAdminPage from './pages/admin/OrdersAdminPage'
import UsersAdminPage from './pages/admin/UsersAdminPage'
import WarrantyAdminPage from './pages/admin/WarrantyAdminPage'
import PromotionsAdminPage from './pages/admin/PromotionsAdminPage'
import InventoryAdminPage from './pages/admin/InventoryAdminPage'
import ReturnsAdminPage from './pages/admin/ReturnsAdminPage'   // ← MỚI


function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

function AdminRoute({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const role = useAuthStore(s => s.user?.role)
  const location = useLocation()

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  if (role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/payment/vnpay-return" element={<VNPayReturnPage />} />
        <Route path="/cart" element={<PrivateRoute><CartPage /></PrivateRoute>} />
        <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
        <Route path="/orders" element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
        <Route path="/orders/:id" element={<PrivateRoute><OrderDetailPage /></PrivateRoute>} />
        <Route path="*" element={<NotFoundPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/payment/result" element={<PaymentResultPage />} />
        <Route path="/warranty/:code?" element={<WarrantyPage />} />
      </Route>

      <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route path="/admin" element={<DashboardPage />} />
        <Route path="/admin/products" element={<ProductsAdminPage />} />
        <Route path="/admin/orders" element={<OrdersAdminPage />} />
        <Route path="/admin/users" element={<UsersAdminPage />} />
        <Route path="/admin/warranty" element={<WarrantyAdminPage />} />
        <Route path="/admin/promotions" element={<PromotionsAdminPage />} />
        <Route path="/admin/inventory" element={<InventoryAdminPage />} />
        <Route path="/admin/returns" element={<ReturnsAdminPage />} />  {/* ← MỚI */}
      </Route>
    </Routes>
  )
}