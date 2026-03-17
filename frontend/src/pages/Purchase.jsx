import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getPurchases, createPurchase, updatePurchase, deletePurchase, markPurchasePaid,
  getMilk, createMilk, updateMilk, deleteMilk, markMilkPaid,
  getKhawa, createKhawa, updateKhawa, deleteKhawa, markKhawaPaid
} from '../api/purchase'

const today = new Date().toISOString().split('T')[0]

const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN') : '-'
const formatAmount = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`

// ===== MODAL =====
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center p-5 border-b">
        <h3 className="text-lg font-bold text-pink-600">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
)

// ===== MARK PAID MODAL =====
const MarkPaidModal = ({ item, totalAmount, onClose, onConfirm }) => {
  const [paymentDate, setPaymentDate] = useState(today)
  const alreadyPaid = item?.paidAmount || 0
  const remaining = totalAmount - alreadyPaid
  const [paidAmount, setPaidAmount] = useState(remaining || '')
  const currentRemaining = totalAmount - alreadyPaid - parseFloat(paidAmount || 0)

  return (
    <Modal title="Record Payment" onClose={onClose}>
      <div className="mb-4 bg-gray-50 rounded-lg p-3">
        <div className="text-sm text-gray-600">Total Amount: <span className="font-bold text-gray-800">₹{Number(totalAmount).toLocaleString('en-IN')}</span></div>
        {alreadyPaid > 0 && (
          <div className="text-sm text-gray-600 mt-1">Already Paid: <span className="font-bold text-green-600">₹{Number(alreadyPaid).toLocaleString('en-IN')}</span></div>
        )}
        {alreadyPaid > 0 && (
          <div className="text-sm text-gray-600 mt-1">Remaining: <span className="font-bold text-orange-600">₹{Number(remaining).toLocaleString('en-IN')}</span></div>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paying Now (₹)</label>
        <input
          type="number"
          value={paidAmount}
          onChange={(e) => {
            const val = parseFloat(e.target.value)
            if (val > remaining) {
                setPaidAmount(remaining)
            } else {
                setPaidAmount(e.target.value)
            }
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
        />
        {currentRemaining > 0 && paidAmount && (
          <p className="text-xs text-orange-500 mt-1">Remaining after this payment: ₹{Number(currentRemaining).toLocaleString('en-IN')}</p>
        )}
        {currentRemaining <= 0 && paidAmount && (
          <p className="text-xs text-green-500 mt-1">✓ Fully paid!</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
        <input
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
        />
      </div>

      <div className="flex gap-3">
        <button onClick={() => onConfirm(paymentDate, paidAmount)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition">
          Confirm Payment
        </button>
        <button onClick={onClose}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition">
          Cancel
        </button>
      </div>
    </Modal>
  )
}
// ===== PAYMENT STATUS BADGE =====
const PaymentBadge = ({ status, onMarkPaid }) => {
  if (status === 'Paid') {
    return (
      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
        PAID
      </span>
    )
  }
  if (status === 'Partial') {
    return (
      <button onClick={onMarkPaid}
        className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold hover:bg-yellow-200 transition">
        PARTIAL
      </button>
    )
  }
  return (
    <button onClick={onMarkPaid}
      className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold hover:bg-orange-200 transition">
      PENDING
    </button>
  )
}

// ===== PURCHASE MATERIAL FORM =====
const PurchaseForm = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: item?.name || '',
    supplier: item?.supplier || '',
    quantity: item?.quantity || '',
    unit: item?.unit || '',
    pricePerUnit: item?.pricePerUnit || '',
    purchaseDate: item?.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : today,
    paymentStatus: item?.paymentStatus || 'Pending',
    paymentDate: item?.paymentDate ? new Date(item.paymentDate).toISOString().split('T')[0] : '',
    paidAmount: item?.paidAmount || ''
  })
  const [loading, setLoading] = useState(false)

  const total = form.quantity && form.pricePerUnit
    ? (parseFloat(form.quantity) * parseFloat(form.pricePerUnit)).toFixed(2)
    : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let res
      if (item?.id) {
        res = await updatePurchase(item.id, form)
        toast.success('Updated!')
      } else {
        res = await createPurchase(form)
        toast.success('Added!')
      }
      onSave(res.data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={item?.id ? 'Edit Material' : 'Add New Material'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {[
          { label: 'Material Name', field: 'name', type: 'text' },
          { label: 'Supplier', field: 'supplier', type: 'text' },
          { label: 'Quantity', field: 'quantity', type: 'number' },
          { label: 'Unit', field: 'unit', type: 'text', placeholder: 'kg, liters, pieces' },
          { label: 'Price per Unit (₹)', field: 'pricePerUnit', type: 'number' },
        ].map(({ label, field, type, placeholder }) => (
          <div className="mb-3" key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type={type}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              placeholder={placeholder || ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
            />
          </div>
        ))}

        {total > 0 && (
          <div className="mb-3 bg-gray-50 rounded-lg px-3 py-2 text-sm">
            <span className="text-gray-600">Total Amount: </span>
            <span className="font-bold text-gray-800">₹{Number(total).toLocaleString('en-IN')}</span>
          </div>
        )}

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Purchase</label>
          <input type="date" value={form.purchaseDate}
            onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
          <select value={form.paymentStatus}
            onChange={(e) => setForm({ 
                ...form, 
                paymentStatus: e.target.value,
                paymentDate: e.target.value === 'Pending' ? '' : form.paymentDate,
                paidAmount: e.target.value === 'Pending' ? '' : form.paidAmount
            })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500">
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
          </select>
        </div>

        {form.paymentStatus === 'Paid' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
            <input type="date" value={form.paymentDate}
              onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg font-medium transition">
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ===== MILK FORM =====
const MilkForm = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState({
    supplier: item?.supplier || '',
    litres: item?.litres || '',
    snf: item?.snf || '',
    fat: item?.fat || '',
    pricePerLitre: item?.pricePerLitre || '',
    purchaseDate: item?.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : today,
    paymentStatus: item?.paymentStatus || 'Pending',
    paymentDate: item?.paymentDate ? new Date(item.paymentDate).toISOString().split('T')[0] : '',
    paidAmount: item?.paidAmount || ''
  })
  const [loading, setLoading] = useState(false)

  const total = form.litres && form.pricePerLitre
    ? (parseFloat(form.litres) * parseFloat(form.pricePerLitre)).toFixed(2)
    : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let res
      if (item?.id) {
        res = await updateMilk(item.id, form)
        toast.success('Updated!')
      } else {
        res = await createMilk(form)
        toast.success('Added!')
      }
      onSave(res.data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={item?.id ? 'Edit Milk Purchase' : 'Add New Milk'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
          <input type="text" value={form.supplier}
            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            placeholder="Enter supplier name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
          />
        </div>

        {[
          { label: 'Litres *', field: 'litres', placeholder: 'Enter litres' },
          { label: 'SNF', field: 'snf', placeholder: 'Enter SNF' },
          { label: 'Fat', field: 'fat', placeholder: 'Enter fat' },
          { label: 'Price per Litre *', field: 'pricePerLitre', placeholder: 'Enter price per litre' },
        ].map(({ label, field, placeholder }) => (
          <div className="mb-3" key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input type="number" value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              placeholder={placeholder}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
            />
          </div>
        ))}

        {total > 0 && (
          <div className="mb-3 bg-gray-50 rounded-lg px-3 py-2 text-sm">
            <span className="text-gray-600">Total Amount: </span>
            <span className="font-bold text-gray-800">₹{Number(total).toLocaleString('en-IN')}</span>
          </div>
        )}

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date *</label>
          <input type="date" value={form.purchaseDate}
            onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status *</label>
          <select value={form.paymentStatus}
                onChange={(e) => setForm({ 
                    ...form, 
                    paymentStatus: e.target.value,
                    paymentDate: e.target.value === 'Pending' ? '' : form.paymentDate,
                    paidAmount: e.target.value === 'Pending' ? '' : form.paidAmount
                })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500">
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
          </select>
        </div>

        {form.paymentStatus === 'Paid' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
            <input type="date" value={form.paymentDate}
              onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg font-medium transition">
            {loading ? 'Saving...' : 'Save Milk Purchase'}
          </button>
          <button type="button" onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ===== KHAWA FORM =====
const KhawaForm = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState({
    supplier: item?.supplier || '',
    quantity: item?.quantity || '',
    pricePerUnit: item?.pricePerUnit || '',
    purchaseDate: item?.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : today,
    paymentStatus: item?.paymentStatus || 'Pending',
    paymentDate: item?.paymentDate ? new Date(item.paymentDate).toISOString().split('T')[0] : '',
    paidAmount: item?.paidAmount || ''
  })
  const [loading, setLoading] = useState(false)

  const total = form.quantity && form.pricePerUnit
    ? (parseFloat(form.quantity) * parseFloat(form.pricePerUnit)).toFixed(2)
    : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let res
      if (item?.id) {
        res = await updateKhawa(item.id, form)
        toast.success('Updated!')
      } else {
        res = await createKhawa(form)
        toast.success('Added!')
      }
      onSave(res.data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={item?.id ? 'Edit Khawa Purchase' : 'Add New Khawa'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
          <input type="text" value={form.supplier}
            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            placeholder="Enter supplier name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg) *</label>
          <input type="number" value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            placeholder="Enter quantity in kg"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Price per kg *</label>
          <input type="number" value={form.pricePerUnit}
            onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })}
            placeholder="Enter price per kg"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
          />
        </div>

        {total > 0 && (
          <div className="mb-3 bg-gray-50 rounded-lg px-3 py-2 text-sm">
            <span className="text-gray-600">Total Amount: </span>
            <span className="font-bold text-gray-800">₹{Number(total).toLocaleString('en-IN')}</span>
          </div>
        )}

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date *</label>
          <input type="date" value={form.purchaseDate}
            onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status *</label>
          <select value={form.paymentStatus}
            onChange={(e) => setForm({ 
                ...form, 
                paymentStatus: e.target.value,
                paymentDate: e.target.value === 'Pending' ? '' : form.paymentDate,
                paidAmount: e.target.value === 'Pending' ? '' : form.paidAmount
            })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500">
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
          </select>
        </div>

        {form.paymentStatus === 'Paid' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
            <input type="date" value={form.paymentDate}
              onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg font-medium transition">
            {loading ? 'Saving...' : 'Save Khawa'}
          </button>
          <button type="button" onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ===== MAIN PURCHASE PAGE =====
export default function Purchase() {
  const [tab, setTab] = useState('materials')
  const [purchases, setPurchases] = useState([])
  const [milk, setMilk] = useState([])
  const [khawa, setKhawa] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [markPaidItem, setMarkPaidItem] = useState(null)
  const [markPaidType, setMarkPaidType] = useState(null)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [pRes, mRes, kRes] = await Promise.all([getPurchases(), getMilk(), getKhawa()])
      setPurchases(pRes.data)
      setMilk(mRes.data)
      setKhawa(kRes.data)
    } catch {
      toast.error('Error loading data')
    } finally {
      setLoading(false)
    }
  }

    const handleMarkPaid = async (paymentDate, paidAmount) => {
    try {
        if (markPaidType === 'material') {
        await markPurchasePaid(markPaidItem.id, paymentDate, paidAmount)
        } else if (markPaidType === 'milk') {
        await markMilkPaid(markPaidItem.id, paymentDate, paidAmount)
        } else if (markPaidType === 'khawa') {
        await markKhawaPaid(markPaidItem.id, paymentDate, paidAmount)
        }
        toast.success('Payment recorded!')
        setMarkPaidItem(null)
        loadAll()
    } catch {
        toast.error('Error updating payment')
    }
    }

  const handleDelete = async (id, type) => {
    if (!confirm('Delete this record?')) return
    try {
      if (type === 'material') await deletePurchase(id)
      else if (type === 'milk') await deleteMilk(id)
      else if (type === 'khawa') await deleteKhawa(id)
      loadAll()
      toast.success('Deleted!')
    } catch {
      toast.error('Error deleting')
    }
  }

  const tabs = [
    { id: 'materials', label: 'Purchase Material' },
    { id: 'milk', label: 'Milk Purchases' },
    { id: 'khawa', label: 'Khawa Purchases' }
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-pink-600 text-lg">Loading...</div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-end gap-6 flex-wrap">
          <h2 className="text-3xl font-bold text-pink-600">Purchase<br />Material</h2>
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  tab === t.id ? 'bg-pink-600 text-white' : 'text-gray-600 hover:bg-gray-200'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => { setSelected(null); setModal(tab) }}
          className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition">
          <Plus size={18} />
          {tab === 'materials' ? 'Add New Material' : tab === 'milk' ? 'Add New Milk' : 'Add New Khawa'}
        </button>
      </div>

      {/* Purchase Material Tab */}
      {tab === 'materials' && (
        <div>
          {/* Table Header */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Name', 'Supplier', 'Quantity', 'Unit', 'Price/Unit', 'Payment to Pay', 'Last Purchase', 'Payment Status', 'Payment Date', 'Actions'].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-12 text-gray-400">No purchase records found.</td></tr>
                ) : purchases.map(group => (
                  <>
                    {/* Supplier Group Header */}
                    <tr key={`header-${group.supplier}`} className="bg-gray-50">
                      <td colSpan={5} className="px-3 py-2">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-800 text-base">{group.supplier}</span>
                          <span className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${
                            group.dueAmount > 0
                              ? 'border-orange-400 text-orange-600'
                              : 'border-green-400 text-green-600'
                          }`}>
                            Due: ₹{Number(group.dueAmount).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </td>
                      <td colSpan={5} className="px-3 py-2 text-right">
                        <button
                          onClick={() => {
                            setSelected({ supplier: group.supplier })
                            setModal('addToSupplier')
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition">
                          + Add Product
                        </button>
                      </td>
                    </tr>
                    {/* Items */}
                    {group.items.map(item => (
                      <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                        <td className="px-3 py-3 text-sm text-gray-700">{item.name}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">{item.supplier}</td>
                        <td className="px-3 py-3 text-sm text-gray-700">{item.quantity}</td>
                        <td className="px-3 py-3 text-sm text-gray-700">{item.unit}</td>
                        <td className="px-3 py-3 text-sm text-gray-700">₹{item.pricePerUnit}</td>
                        <td className="px-3 py-3 text-sm font-bold text-gray-800">
                          {formatAmount(item.quantity * item.pricePerUnit)}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600">{formatDate(item.purchaseDate)}</td>
                        <td className="px-3 py-3">
                          <PaymentBadge
                            status={item.paymentStatus}
                            onMarkPaid={() => { setMarkPaidItem(item); setMarkPaidType('material') }}
                          />
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600">{formatDate(item.paymentDate)}</td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => { setSelected(item); setModal('editMaterial') }}
                              className="text-pink-600 hover:text-pink-700 p-1"><Pencil size={14} /></button>
                            <button onClick={() => handleDelete(item.id, 'material')}
                              className="text-red-500 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                          </div>
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
      )}

      {/* Milk Tab */}
      {tab === 'milk' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h3 className="font-bold text-gray-800">Milk Purchases</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Litres', 'SNF', 'Fat', 'Price/Litre', 'Amount', 'Date', 'Payment Status', 'Payment Date', 'Actions'].map(h => (
                  <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {milk.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">No milk purchases found.</td></tr>
              ) : milk.map(group => (
                <>
                  <tr key={`milk-${group.supplier}`} className="bg-gray-50">
                    <td colSpan={5} className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-800">{group.supplier}</span>
                        <span className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${
                          group.dueAmount > 0 ? 'border-orange-400 text-orange-600' : 'border-green-400 text-green-600'
                        }`}>
                          Due: ₹{Number(group.dueAmount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </td>
                    <td colSpan={4} className="px-3 py-2 text-right">
                      <button onClick={() => { setSelected({ supplier: group.supplier }); setModal('addMilkToSupplier') }}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition">
                        + Add Milk
                      </button>
                    </td>
                  </tr>
                  {group.items.map(item => (
                    <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-3 py-3 text-sm text-gray-700">{item.litres} L</td>
                      <td className="px-3 py-3 text-sm text-gray-700">{item.snf}</td>
                      <td className="px-3 py-3 text-sm text-gray-700">{item.fat}</td>
                      <td className="px-3 py-3 text-sm text-gray-700">₹{item.pricePerLitre}</td>
                      <td className="px-3 py-3 text-sm font-bold text-gray-800">{formatAmount(item.totalAmount)}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">{formatDate(item.purchaseDate)}</td>
                      <td className="px-3 py-3">
                        <PaymentBadge
                          status={item.paymentStatus}
                          onMarkPaid={() => { setMarkPaidItem(item); setMarkPaidType('milk') }}
                        />
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600">{formatDate(item.paymentDate)}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setSelected(item); setModal('editMilk') }}
                            className="text-pink-600 hover:text-pink-700 p-1"><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(item.id, 'milk')}
                            className="text-red-500 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Khawa Tab */}
      {tab === 'khawa' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h3 className="font-bold text-gray-800">Khawa Purchases</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Quantity', 'Price/Unit', 'Total Amount', 'Date of Purchase', 'Payment Status', 'Payment Date', 'Actions'].map(h => (
                  <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {khawa.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No khawa purchases found.</td></tr>
              ) : khawa.map(group => (
                <>
                  <tr key={`khawa-${group.supplier}`} className="bg-gray-50">
                    <td colSpan={3} className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-800">{group.supplier}</span>
                        <span className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${
                          group.dueAmount > 0 ? 'border-orange-400 text-orange-600' : 'border-green-400 text-green-600'
                        }`}>
                          Due: ₹{Number(group.dueAmount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </td>
                    <td colSpan={4} className="px-3 py-2 text-right">
                      <button onClick={() => { setSelected({ supplier: group.supplier }); setModal('addKhawaToSupplier') }}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition">
                        + Add Khawa
                      </button>
                    </td>
                  </tr>
                  {group.items.map(item => (
                    <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-3 py-3 text-sm text-gray-700">{item.quantity} kg</td>
                      <td className="px-3 py-3 text-sm text-gray-700">₹{item.pricePerUnit}</td>
                      <td className="px-3 py-3 text-sm font-bold text-gray-800">{formatAmount(item.totalAmount)}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">{formatDate(item.purchaseDate)}</td>
                      <td className="px-3 py-3">
                        <PaymentBadge
                          status={item.paymentStatus}
                          onMarkPaid={() => { setMarkPaidItem(item); setMarkPaidType('khawa') }}
                        />
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600">{formatDate(item.paymentDate)}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setSelected(item); setModal('editKhawa') }}
                            className="text-pink-600 hover:text-pink-700 p-1"><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(item.id, 'khawa')}
                            className="text-red-500 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {(modal === 'materials' || modal === 'editMaterial' || modal === 'addToSupplier') && (
        <PurchaseForm
          item={modal === 'editMaterial' ? selected : modal === 'addToSupplier' ? { supplier: selected?.supplier } : null}
          onClose={() => setModal(null)}
          onSave={() => { loadAll(); setModal(null) }}
        />
      )}

      {(modal === 'milk' || modal === 'editMilk' || modal === 'addMilkToSupplier') && (
        <MilkForm
          item={modal === 'editMilk' ? selected : modal === 'addMilkToSupplier' ? { supplier: selected?.supplier } : null}
          onClose={() => setModal(null)}
          onSave={() => { loadAll(); setModal(null) }}
        />
      )}

      {(modal === 'khawa' || modal === 'editKhawa' || modal === 'addKhawaToSupplier') && (
        <KhawaForm
          item={modal === 'editKhawa' ? selected : modal === 'addKhawaToSupplier' ? { supplier: selected?.supplier } : null}
          onClose={() => setModal(null)}
          onSave={() => { loadAll(); setModal(null) }}
        />
      )}

      {markPaidItem && (
        <MarkPaidModal
            item={markPaidItem}
            totalAmount={
            markPaidType === 'material'
                ? markPaidItem.quantity * markPaidItem.pricePerUnit
                : markPaidItem.totalAmount
            }
            onClose={() => setMarkPaidItem(null)}
            onConfirm={handleMarkPaid}
        />
        )}
    </div>
  )
}