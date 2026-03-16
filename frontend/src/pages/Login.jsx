import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await login(username, password)
      loginUser(data.token, data.username)
      toast.success('Login successful!')
      navigate('/dashboard')
    } catch (error) {
      toast.error('Invalid username or password!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-pink-500 flex items-center justify-center relative overflow-hidden">
      
      {/* Background images grid */}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-90">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 , bg-red-400">
            <img src="/img1.jpg" className="w-full h-full object-contain" alt="" />
            <img src="/img2.jpg" className="w-full h-full object-contain" alt="" />
            <img src="/img3.jpg" className="w-full h-full object-contain" alt="" />
            <img src="/img4.jpg" className="w-full h-full object-contain" alt="" />
        </div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 bg-white bg-opacity-95 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        <h1 className="text-3xl font-bold text-pink-600 text-center mb-1">
          Ice Cream Factory
        </h1>
        <h2 className="text-gray-500 text-center mb-6 text-lg">
          Admin Login
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-600 font-medium mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-pink-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-600 font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-pink-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 rounded-lg transition duration-200"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}