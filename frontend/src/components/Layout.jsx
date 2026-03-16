import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, IceCream, Warehouse, ShoppingCart,
  Receipt, Users, Truck, UserCircle, BarChart3, LogOut, Menu, X, Settings
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/dashboard/inventory', label: 'Ice Cream Inventory', icon: IceCream },
  { path: '/dashboard/godown', label: 'Raw Material (Godown)', icon: Warehouse },
  { path: '/dashboard/purchase', label: 'Purchase Material', icon: ShoppingCart },
  { path: '/dashboard/sales', label: 'Sales & Billing', icon: Receipt },
  { path: '/dashboard/workers', label: 'Workers', icon: Users },
  { path: '/dashboard/transport', label: 'Transport', icon: Truck },
  { path: '/dashboard/customers', label: 'Customer Information', icon: UserCircle },
  { path: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  { path: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function Layout({ children }) {
  const { username, logoutUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    logoutUser()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-500 hover:text-pink-600"
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h1 className="text-xl font-bold text-pink-600">
              Ice Cream Factory Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-600 font-medium">{username}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 bg-gray-700 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm transition"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-14">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 bg-white shadow-sm fixed left-0 top-14 bottom-0 overflow-y-auto z-40">
            <nav className="p-3">
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  return (
                    <li key={item.path}>
                      <button
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                          isActive
                            ? 'bg-pink-600 text-white'
                            : 'text-gray-600 hover:bg-pink-50 hover:text-pink-600'
                        }`}
                      >
                        <Icon size={18} />
                        {item.label}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 p-6 transition-all ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          {children}
        </main>
      </div>
    </div>
  )
}