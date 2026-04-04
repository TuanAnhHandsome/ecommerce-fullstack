import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import VNPayTestCard from "./VNPayTestCard";
import { useAuthStore } from '../../store/authStore'

export default function MainLayout() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <Outlet />

        {/* Hiển thị VNPay test khi đã login */}
        {isAuthenticated && <VNPayTestCard />}
      </main>

      <Footer />
    </div>
  )
}