import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, History, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomerHistory } from '../api/customers'

const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN') : '-'
const formatAmount = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`

// ===== HISTORY MODAL =====
const HistoryModal = ({ customer, onClose }) => {
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getCustomerHistory(customer.id)
        setHistory(res.data)
      } catch {
        toast.error('Error loading history')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [customer.id])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-lg font-bold text-pink-600">Bill History - {customer.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : !history ? (
            <div className="text-center py-8 text-gray-400">No history found.</div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600 mb-1">Total Paid</div>
                  <div className="text-xl font-bold text-green-600">{formatAmount(history.totalPaid)}</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600 mb-1">Total Pending</div>
                  <div className="text-xl font-bold text-orange-600">{formatAmount(history.totalPending)}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600 mb-1">Total Bills</div>
                  <div className="text-xl font-bold text-blue-600">{history.totalBills}</div>
                </div>
              </div>

              {/* Bills List */}
              {history.sales.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No bills yet.</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {['Bill ID', 'Date', 'Amount', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-sm font-semibold text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.sales.map(sale => (
                      <tr key={sale.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-700">{sale.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(sale.billDate)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-800">{formatAmount(sale.totalAmount)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            sale.paymentStatus === 'Paid'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {sale.paymentStatus.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== CUSTOMER FORM (inline) =====
const CustomerForm = ({ customer, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || ''
  })
  const [loading, setLoading] = useState(false)
  const isEdit = !!customer?.id

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.address) {
      return toast.error('Name, phone and address are required')
    }
    setLoading(true)
    try {
      let res
      if (isEdit) {
        res = await updateCustomer(customer.id, form)
        toast.success('Customer updated!')
      } else {
        res = await createCustomer(form)
        toast.success('Customer added!')
      }
      onSave(res.data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving customer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        {isEdit ? 'Edit Customer' : 'Add New Customer'}
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Enter customer full name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Enter phone number"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address (Optional)</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Enter email address"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Enter complete address"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg font-medium transition">
            {loading ? 'Saving...' : isEdit ? 'Update Customer' : 'Save Customer'}
          </button>
          <button type="button" onClick={onClose}
            className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

// ===== MAIN CUSTOMERS PAGE =====
export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editCustomer, setEditCustomer] = useState(null)
  const [historyCustomer, setHistoryCustomer] = useState(null)

  useEffect(() => { loadCustomers() }, [])

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const res = await getCustomers()
      setCustomers(res.data)
    } catch {
      toast.error('Error loading customers')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer?')) return
    try {
      await deleteCustomer(id)
      setCustomers(customers.filter(c => c.id !== id))
      toast.success('Customer deleted')
    } catch {
      toast.error('Error deleting customer')
    }
  }

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-pink-600 text-lg">Loading...</div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <h2 className="text-3xl font-bold text-pink-600">Customer<br />Information</h2>
        {!showForm && !editCustomer && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition"
          >
            <Plus size={18} /> Add New Customer
          </button>
        )}
      </div>

      {/* Add Form */}
      {showForm && (
        <CustomerForm
          onClose={() => setShowForm(false)}
          onSave={(saved) => {
            setCustomers([...customers, saved])
            setShowForm(false)
          }}
        />
      )}

      {/* Edit Form */}
      {editCustomer && (
        <CustomerForm
          customer={editCustomer}
          onClose={() => setEditCustomer(null)}
          onSave={(saved) => {
            setCustomers(customers.map(c => c.id === saved.id ? saved : c))
            setEditCustomer(null)
          }}
        />
      )}

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, address..."
          className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-pink-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Customer ID', 'Name', 'Contact', 'Email', 'Address', 'Total Bills', 'Pending Amount', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-sm font-semibold text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  No customers found.
                </td>
              </tr>
            ) : filteredCustomers.map(customer => (
              <tr key={customer.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-sm text-gray-500">{customer.id}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{customer.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{customer.phone}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{customer.email || 'N/A'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{customer.address}</td>
                <td className="px-4 py-3 text-sm text-center font-medium text-gray-700">{customer.totalBills}</td>
                <td className="px-4 py-3 text-sm font-bold text-orange-600">
                  {customer.pendingAmount > 0 ? formatAmount(customer.pendingAmount) : '₹0'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setHistoryCustomer(customer)}
                      className="text-gray-500 hover:text-gray-700 p-1 rounded transition"
                      title="View history"
                    >
                      <History size={16} />
                    </button>
                    <button
                      onClick={() => { setEditCustomer(customer); setShowForm(false) }}
                      className="text-pink-600 hover:text-pink-700 p-1 rounded transition"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="text-red-500 hover:text-red-600 p-1 rounded transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* History Modal */}
      {historyCustomer && (
        <HistoryModal
          customer={historyCustomer}
          onClose={() => setHistoryCustomer(null)}
        />
      )}
    </div>
  )
}