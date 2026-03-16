import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Shield, Eye, EyeOff } from 'lucide-react'

export default function Settings() {
  const { username, loginUser, logoutUser } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    currentPassword: '',
    newUsername: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.currentPassword) {
      return toast.error('Current password is required')
    }

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      return toast.error('New passwords do not match')
    }

    if (form.newPassword && form.newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters')
    }

    if (!form.newUsername && !form.newPassword) {
      return toast.error('Enter a new username or password to update')
    }

    setLoading(true)
    try {
      const res = await axios.put('/api/auth/credentials', {
        currentPassword: form.currentPassword,
        newUsername: form.newUsername || undefined,
        newPassword: form.newPassword || undefined
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })

      toast.success('Credentials updated successfully!')

      // If username changed, update auth context and logout
      if (form.newUsername && form.newUsername !== username) {
        toast('Please login again with your new credentials', { icon: 'ℹ️' })
        setTimeout(() => {
          logoutUser()
          navigate('/')
        }, 2000)
      } else {
        // Reset form
        setForm({ currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '' })
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="text-pink-600" size={28} />
        <h2 className="text-3xl font-bold text-pink-600">Settings</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-1">Change Credentials</h3>
        <p className="text-sm text-gray-500 mb-6">
          Enter your current password to make any changes.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Current Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                placeholder="Enter current password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:border-pink-500"
              />
              <button type="button"
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="border-t my-4" />
          <p className="text-xs text-gray-500 mb-4">
            Leave blank if you don't want to change that field.
          </p>

          {/* New Username */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Username
            </label>
            <input
              type="text"
              value={form.newUsername}
              onChange={(e) => setForm({ ...form, newUsername: e.target.value })}
              placeholder={`Current: ${username}`}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* New Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                placeholder="Enter new password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:border-pink-500"
              />
              <button type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:border-pink-500"
              />
              <button type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
            {form.newPassword && form.confirmPassword && form.newPassword === form.confirmPassword && (
              <p className="text-xs text-green-500 mt-1">✓ Passwords match</p>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2.5 rounded-lg font-medium transition">
            {loading ? 'Updating...' : 'Update Credentials'}
          </button>
        </form>
      </div>
    </div>
  )
}