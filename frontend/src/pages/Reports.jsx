import { useState } from 'react'
import { Search, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { getSalesReport, getInventoryReport, getGodownReport, getPurchaseReport } from '../api/reports'

const today = new Date().toISOString().split('T')[0]
const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN') : '-'
const formatAmount = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`

const REPORT_TYPES = [
  { id: 'sales', label: 'Sales Report' },
  { id: 'inventory', label: 'Inventory Report' },
  { id: 'godown', label: 'Raw Material (Godown) Report' },
  { id: 'purchase', label: 'Purchase Material Report' }
]

// ===== EXPORT TO CSV =====
const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return toast.error('No data to export')
  const headers = Object.keys(data[0])
  const rows = data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${today}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('CSV exported!')
}

// ===== STAT CARD =====
const StatCard = ({ label, value, color = 'pink' }) => {
  const colors = {
    pink: 'text-pink-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    blue: 'text-blue-600',
    red: 'text-red-600'
  }
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 text-center">
      <div className={`text-2xl font-bold ${colors[color]}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}

// ===== SALES REPORT =====
const SalesReportView = ({ data }) => {
  if (!data) return null
  const csvData = data.sales.map(s => ({
    BillID: s.billNumber,
    Date: formatDate(s.billDate),
    Customer: s.customer?.name || '-',
    Items: s.items.map(i => `${i.product?.flavor} ${i.product?.size} (${i.quantity})`).join('; '),
    Quantity: s.items.reduce((sum, i) => sum + i.quantity, 0),
    Boxes: s.items.reduce((sum, i) => sum + i.boxes, 0).toFixed(2),
    Amount: s.totalAmount,
    PaymentStatus: s.paymentStatus
  }))

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total Bills" value={data.totalBills} color="blue" />
        <StatCard label="Total Revenue" value={formatAmount(data.totalRevenue)} color="green" />
        <StatCard label="Pending Payments" value={formatAmount(data.pendingPayments)} color="orange" />
        <StatCard label="Items Sold" value={data.itemsSold} color="pink" />
        <StatCard label="Boxes Used" value={data.boxesUsed} color="blue" />
      </div>

      {/* Export */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800">Sales Report</h3>
        <button onClick={() => exportToCSV(csvData, 'sales_report')}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition">
          <Download size={16} /> Export to CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Bill ID', 'Date', 'Customer', 'Items', 'Quantity', 'Boxes', 'Amount', 'Payment Status'].map(h => (
                <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.sales.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">No sales found.</td></tr>
            ) : data.sales.map(sale => (
              <tr key={sale.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 text-sm font-medium text-gray-800">{sale.billNumber}</td>
                <td className="px-3 py-2 text-sm text-gray-600">{formatDate(sale.billDate)}</td>
                <td className="px-3 py-2 text-sm text-gray-700">{sale.customer?.name}</td>
                <td className="px-3 py-2 text-sm text-gray-600">
                  {sale.items.map((item, idx) => (
                    <div key={idx}>
                      {item.product?.flavor} {item.product?.category?.name} {item.product?.size}
                      ({item.quantity}) {parseFloat(item.boxes) > 0 ? `[${parseFloat(item.boxes).toFixed(2)} box]` : ''}
                    </div>
                  ))}
                </td>
                <td className="px-3 py-2 text-sm text-gray-700">
                  {sale.items.reduce((sum, i) => sum + i.quantity, 0)}
                </td>
                <td className="px-3 py-2 text-sm text-gray-700">
                    {sale.items.reduce((sum, i) => sum + parseFloat(i.boxes || 0), 0).toFixed(2)}
                </td>
                <td className="px-3 py-2 text-sm font-bold text-gray-800">{formatAmount(sale.totalAmount)}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    sale.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                    sale.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>{sale.paymentStatus}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  )
}

// ===== INVENTORY REPORT =====
const InventoryReportView = ({ data }) => {
  if (!data) return null
  const csvData = data.products.map(p => ({
    Category: p.category?.name,
    Product: p.flavor,
    Size: p.size,
    Price: p.price,
    CurrentStock: p.quantity,
    StockValue: p.price * p.quantity
  }))

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Products" value={data.totalProducts} color="blue" />
        <StatCard label="Total Stock Value" value={formatAmount(data.totalStockValue)} color="green" />
        <StatCard label="Out of Stock" value={data.outOfStock} color="red" />
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800">Inventory Report</h3>
        <button onClick={() => exportToCSV(csvData, 'inventory_report')}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition">
          <Download size={16} /> Export to CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Category', 'Product', 'Size', 'Flavor', 'Price (₹)', 'Current Stock', 'Stock Value (₹)'].map(h => (
                <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.products.map(p => (
              <tr key={p.id} className={`border-b hover:bg-gray-50 ${p.quantity === 0 ? 'bg-red-50' : ''}`}>
                <td className="px-3 py-2 text-sm text-gray-700">{p.category?.name}</td>
                <td className="px-3 py-2 text-sm font-medium text-gray-800">{p.flavor}</td>
                <td className="px-3 py-2 text-sm text-gray-600">{p.size}</td>
                <td className="px-3 py-2 text-sm text-gray-600">{p.flavor}</td>
                <td className="px-3 py-2 text-sm text-gray-700">₹{p.price.toFixed(2)}</td>
                <td className="px-3 py-2 text-sm">
                  <span className={p.quantity === 0 ? 'text-red-600 font-bold' : 'text-gray-700'}>
                    {p.quantity}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm font-medium text-gray-700">
                  ₹{(p.price * p.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  )
}

// ===== GODOWN REPORT =====
const GodownReportView = ({ data }) => {
  if (!data) return null
  const csvData = data.materials.map(m => ({
    MaterialName: m.name,
    AvailableQuantity: m.availableQuantity,
    TodayUsed: m.todayUsed,
    TotalUsed: m.totalUsed,
    Unit: m.unit
  }))

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 mb-6">
        <StatCard label="Total Materials" value={data.totalMaterials} color="blue" />
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800">Raw Material (Godown) Report</h3>
        <button onClick={() => exportToCSV(csvData, 'godown_report')}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition">
          <Download size={16} /> Export to CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Material Name', 'Available Quantity', 'Today Used', 'Total Used', 'Unit'].map(h => (
                <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.materials.map(m => (
              <tr key={m.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 text-sm font-medium text-gray-800">{m.name}</td>
                <td className="px-3 py-2 text-sm text-gray-700">{m.availableQuantity.toFixed(2)}</td>
                <td className="px-3 py-2 text-sm text-gray-700">{m.todayUsed.toFixed(2)}</td>
                <td className="px-3 py-2 text-sm text-gray-700">{m.totalUsed.toFixed(2)}</td>
                <td className="px-3 py-2 text-sm text-gray-600">{m.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  )
}

// ===== PURCHASE REPORT =====
const PurchaseReportView = ({ data }) => {
  if (!data) return null
  const csvData = data.suppliers.flatMap(s => s.items.map(item => ({
    Supplier: s.supplier,
    Name: item.name,
    Quantity: item.quantity,
    Unit: item.unit,
    PricePerUnit: item.pricePerUnit,
    TotalAmount: item.totalAmount,
    PurchaseDate: formatDate(item.purchaseDate),
    PaymentStatus: item.paymentStatus
  })))

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Purchases" value={data.totalPurchases} color="blue" />
        <StatCard label="Total Amount" value={formatAmount(data.totalAmount)} color="pink" />
        <StatCard label="Total Paid" value={formatAmount(data.totalPaid)} color="green" />
        <StatCard label="Pending Payments" value={formatAmount(data.pendingPayments)} color="orange" />
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800">Purchase Material Report</h3>
        <button onClick={() => exportToCSV(csvData, 'purchase_report')}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition">
          <Download size={16} /> Export to CSV
        </button>
      </div>

      {/* Table Header */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Supplier', 'Material Name', 'Quantity', 'Unit', 'Price/Unit (₹)', 'Total Amount (₹)', 'Purchase Date', 'Payment Status'].map(h => (
                <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.suppliers.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">No purchases found.</td></tr>
            ) : data.suppliers.map(group => (
              <>
                <tr key={`header-${group.supplier}`} className="bg-pink-50">
                  <td colSpan={8} className="px-3 py-2">
                    <span className="font-bold text-gray-800">Supplier: {group.supplier}</span>
                    <span className="text-gray-500 text-sm ml-3">Total Purchases: {group.items.length}</span>
                  </td>
                </tr>
                {group.items.map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm text-gray-600">{group.supplier}</td>
                    <td className="px-3 py-2 text-sm font-medium text-gray-800">{item.name}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{item.quantity}</td>
                    <td className="px-3 py-2 text-sm text-gray-600">{item.unit}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">₹{item.pricePerUnit}</td>
                    <td className="px-3 py-2 text-sm font-bold text-gray-800">₹{Number(item.totalAmount).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-sm text-gray-600">{formatDate(item.purchaseDate)}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        item.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                        item.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>{item.paymentStatus}</span>
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  )
}

// ===== MAIN REPORTS PAGE =====
export default function Reports() {
  const [reportType, setReportType] = useState('sales')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    setData(null)
    try {
      let res
      if (reportType === 'sales') {
        res = await getSalesReport({ fromDate, toDate })
      } else if (reportType === 'inventory') {
        res = await getInventoryReport()
      } else if (reportType === 'godown') {
        res = await getGodownReport()
      } else if (reportType === 'purchase') {
        res = await getPurchaseReport({ fromDate, toDate })
      }
      setData(res.data)
    } catch {
      toast.error('Error generating report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <h2 className="text-3xl font-bold text-pink-600 mb-6">Reports & Analytics</h2>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        {/* Report Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
          <div className="flex gap-2 flex-wrap">
            {REPORT_TYPES.map(r => (
              <button key={r.id} onClick={() => { setReportType(r.id); setData(null) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  reportType === r.id ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range (Sales and Purchase) */}
        {(reportType === 'sales' || reportType === 'purchase') && (
          <div className="flex gap-4 mb-4 flex-wrap items-end">
            <div>
              <label className="block text-xs text-gray-600 mb-1">From</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">To</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button onClick={handleGenerate} disabled={loading}
          className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition">
          <Search size={16} />
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* Report Output */}
      {loading && (
        <div className="text-center py-12 text-pink-600 text-lg">Generating report...</div>
      )}

      {!loading && data && (
        <>
          {reportType === 'sales' && <SalesReportView data={data} />}
          {reportType === 'inventory' && <InventoryReportView data={data} />}
          {reportType === 'godown' && <GodownReportView data={data} />}
          {reportType === 'purchase' && <PurchaseReportView data={data} />}
        </>
      )}

      {!loading && !data && (
        <div className="text-center py-12 text-gray-400">
          Select a report type and click Generate Report
        </div>
      )}
    </div>
  )
}