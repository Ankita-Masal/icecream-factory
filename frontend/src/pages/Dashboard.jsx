import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getDashboardData } from '../api/dashboard'
import toast from 'react-hot-toast'

const formatAmount = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`

const COLORS = ['#db2777', '#be185d', '#9d174d', '#831843', '#ec4899', '#f472b6', '#fbcfe8', '#fce7f3']

const StatCard = ({ label, value, icon, color }) => {
  const colors = {
    pink: 'bg-pink-600',
    green: 'bg-green-600',
    orange: 'bg-orange-500',
    blue: 'bg-blue-600'
  }
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
      <div className={`${colors[color]} text-white p-3 rounded-full text-2xl`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-sm text-gray-500 uppercase tracking-wide">{label}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getDashboardData()
        setData(res.data)
      } catch {
        toast.error('Error loading dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-pink-600 text-lg">Loading dashboard...</div>
    </div>
  )

  if (!data) return null

  return (
    <div>
      <h2 className="text-3xl font-bold text-pink-600 mb-6">Dashboard Overview</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Products"
          value={data.totalProducts}
          icon="🍦"
          color="pink"
        />
        <StatCard
          label="Today's Sales"
          value={formatAmount(data.todaySalesTotal)}
          icon="🛒"
          color="green"
        />
        <StatCard
          label="Pending Payments"
          value={formatAmount(data.pendingPayments)}
          icon="💰"
          color="orange"
        />
        <StatCard
          label="Purchase Pending"
          value={formatAmount(data.purchasePendingTotal)}
          icon="📦"
          color="blue"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-bold text-pink-600 text-lg mb-4">Sales by Category</h3>
          {data.salesByCategory.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No sales data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.salesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.salesByCategory.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatAmount(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Inventory Status */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-bold text-pink-600 text-lg mb-4">Inventory Status</h3>
          {data.inventoryStatus.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No inventory data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.inventoryStatus} margin={{ bottom: 60 }}>
                <XAxis
                  dataKey="name"
                  angle={-35}
                  textAnchor="end"
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantity" name="Current Stock" fill="#db2777" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}