import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Inventory from './pages/Inventory'
import Godown from './pages/Godown'
import Purchase from './pages/Purchase'
import Customers from './pages/Customers'
import Sales from './pages/Sales'
import Workers from './pages/Workers'
import Transport from './pages/Transport'
import Reports from './pages/Reports'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'

const ProtectedRoute = ({ children }) => {
  const { token } = useAuth()
  return token ? children : <Navigate to="/" />
}



function AppRoutes() {
  const { token } = useAuth()

  return (
    <Routes>
      <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Login />} />
    
      <Route path="/dashboard/inventory" element={
        <ProtectedRoute>
          <Layout>
            <Inventory />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/godown" element={
        <ProtectedRoute>
          <Layout>
            <Godown />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/purchase" element={
        <ProtectedRoute>
          <Layout>
            <Purchase />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/customers" element={
        <ProtectedRoute>
          <Layout>
            <Customers />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/sales" element={
        <ProtectedRoute>
          <Layout>
            <Sales />
            </Layout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/workers" element={
        <ProtectedRoute>
          <Layout>
            <Workers />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/transport" element={
        <ProtectedRoute>
          <Layout>
            <Transport />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/reports" element={
        <ProtectedRoute>
          <Layout>
            <Reports />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/settings" element={
        <ProtectedRoute>
            <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>

    
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App