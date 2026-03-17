import { useState, useEffect, useRef } from 'react'
import { Plus, Eye, Pencil, Trash2, Search, Printer, X, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { getSales, createSale, updateSale, deleteSale, markSalePaid, finalizeBill, getBillVersions } from '../api/sales'
import { getProducts } from '../api/inventory'
import { getCustomers, createCustomer } from '../api/customers'

const today = new Date().toISOString().split('T')[0]
const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN') : '-'
const formatAmount = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`

// ===== MODAL WRAPPER =====
const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className={`bg-white rounded-xl shadow-xl w-full ${wide ? 'max-w-4xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}>
      <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white">
        <h3 className="text-lg font-bold text-pink-600">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
)

// ===== PAYMENT BADGE =====
const PaymentBadge = ({ status, onMarkPaid }) => {
  if (status === 'Paid') return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">PAID</span>
  if (status === 'Partial') return <button onClick={onMarkPaid} className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold hover:bg-yellow-200 transition">PARTIAL</button>
  return <button onClick={onMarkPaid} className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold hover:bg-orange-200 transition">PENDING</button>
}

// ===== MARK PAID MODAL =====
const MarkPaidModal = ({ sale, onClose, onConfirm }) => {
  const alreadyPaid = sale?.paidAmount || 0
  const remaining = sale.totalAmount - alreadyPaid
  const [paidAmount, setPaidAmount] = useState(remaining)
  const [paymentDate, setPaymentDate] = useState(today)
  const currentRemaining = remaining - parseFloat(paidAmount || 0)

  return (
    <Modal title="Record Payment" onClose={onClose}>
      <div className="mb-4 bg-gray-50 rounded-lg p-3 text-sm">
        <div>Total: <span className="font-bold">{formatAmount(sale.totalAmount)}</span></div>
        {alreadyPaid > 0 && <div>Already Paid: <span className="font-bold text-green-600">{formatAmount(alreadyPaid)}</span></div>}
        {alreadyPaid > 0 && <div>Remaining: <span className="font-bold text-orange-600">{formatAmount(remaining)}</span></div>}
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paying Now (₹)</label>
        <input type="number" value={paidAmount}
          onChange={(e) => setPaidAmount(Math.min(parseFloat(e.target.value) || 0, remaining))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
        />
        {currentRemaining > 0 && paidAmount && <p className="text-xs text-orange-500 mt-1">Remaining: {formatAmount(currentRemaining)}</p>}
        {currentRemaining <= 0 && paidAmount && <p className="text-xs text-green-500 mt-1">✓ Fully paid!</p>}
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
        <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
        />
      </div>
      <div className="flex gap-3">
        <button onClick={() => onConfirm(paymentDate, paidAmount)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition">
          Confirm Payment
        </button>
        <button onClick={onClose} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition">
          Cancel
        </button>
      </div>
    </Modal>
  )
}

// ===== BILL VIEW MODAL =====
const BillViewModal = ({ sale, onClose, onFinalize }) => {
  const [versions, setVersions] = useState([])
  const [loadingVersions, setLoadingVersions] = useState(true)
  const printRef = useRef()

  useEffect(() => {
    getBillVersions(sale.id).then(res => setVersions(res.data)).finally(() => setLoadingVersions(false))
  }, [sale.id])

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>${sale.billNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; }
        .header { text-align: center; margin-bottom: 20px; }
        .total { font-weight: bold; font-size: 18px; }
      </style>
      </head><body>${printContent}</body></html>
    `)
    win.document.close()
    win.print()
  }

  return (
    <Modal title={`${sale.billNumber} — ${sale.customer?.name}`} onClose={onClose} wide>
      <div ref={printRef}>
        {/* Bill Header */}
        <div className="header mb-6">
          <h2 className="text-2xl font-bold text-pink-600">Ice Cream Factory</h2>
          <div className="text-gray-600 mt-2">
            <span className="mr-4">Bill: <strong>{sale.billNumber}</strong></span>
            <span className="mr-4">Date: <strong>{formatDate(sale.billDate)}</strong></span>
            <span className="mr-4">Type: <strong className={sale.billType === 'Final' ? 'text-green-600' : 'text-orange-600'}>{sale.billType}</strong></span>
          </div>
          <div className="text-gray-600">Customer: <strong>{sale.customer?.name}</strong></div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-4">
          <thead className="bg-gray-50">
            <tr>
              {['#', 'Product', 'Category', 'Size', 'Qty', 'Boxes', 'Rate', 'Amount'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-sm font-semibold text-gray-600 border-b">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sale.items?.map((item, idx) => (
              <tr key={item.id} className="border-b">
                <td className="px-3 py-2 text-sm">{idx + 1}</td>
                <td className="px-3 py-2 text-sm font-medium">{item.product?.flavor}</td>
                <td className="px-3 py-2 text-sm">{item.product?.category?.name}</td>
                <td className="px-3 py-2 text-sm">{item.product?.size}</td>
                <td className="px-3 py-2 text-sm">{item.quantity}</td>
                <td className="px-3 py-2 text-sm">{item.boxes > 0 ? item.boxes.toFixed(2) : '-'}</td>
                <td className="px-3 py-2 text-sm">{formatAmount(item.price)}</td>
                <td className="px-3 py-2 text-sm font-bold">{formatAmount(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50">
              <td colSpan={7} className="px-3 py-2 text-right font-bold">Total:</td>
              <td className="px-3 py-2 font-bold text-pink-600 text-lg">{formatAmount(sale.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Payment Info */}
        <div className="bg-gray-50 rounded-lg p-3 text-sm mb-4">
          <span className="mr-4">Payment: <strong>{sale.paymentStatus}</strong></span>
          {sale.paidAmount > 0 && <span className="mr-4">Paid: <strong className="text-green-600">{formatAmount(sale.paidAmount)}</strong></span>}
          {sale.paymentDate && <span>Payment Date: <strong>{formatDate(sale.paymentDate)}</strong></span>}
        </div>
      </div>

      {/* Version History */}
      {/* Version History */}
      <div className="mt-4 border-t pt-4">
        <h4 className="font-bold text-gray-700 mb-3">Edit History</h4>
        {loadingVersions ? (
          <div className="text-gray-400 text-sm">Loading...</div>
        ) : versions.length === 0 ? (
          <div className="text-gray-400 text-sm">No versions found.</div>
        ) : (
          <div className="space-y-2">
            {versions.map(v => (
              <details key={v.id} className="bg-gray-50 rounded-lg">
                <summary className="p-3 cursor-pointer text-sm flex justify-between items-center list-none">
                  <div>
                    <span className="font-medium">Version {v.version} — {v.note}</span>
                    <span className="text-gray-500 ml-3 text-xs">{new Date(v.editedAt).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-gray-600 text-xs">{formatAmount(v.total)} | {v.billType} ▼</div>
                </summary>
                <div className="px-3 pb-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1 text-xs text-gray-500">Product</th>
                        <th className="text-left py-1 text-xs text-gray-500">Qty</th>
                        <th className="text-left py-1 text-xs text-gray-500">Rate</th>
                        <th className="text-left py-1 text-xs text-gray-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(v.items) && v.items.map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-1">{item.product?.flavor || `Product #${item.productId}`} {item.product?.size || ''}</td>
                          <td className="py-1">{item.quantity}</td>
                          <td className="py-1">{formatAmount(item.price)}</td>
                          <td className="py-1 font-medium">{formatAmount(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} className="py-1 text-right font-bold text-sm">Total:</td>
                        <td className="py-1 font-bold text-pink-600">{formatAmount(v.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4 pt-4 border-t">
        <button onClick={handlePrint}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm transition">
          <Printer size={16} /> Print
        </button>
        {sale.billType === 'Rough' && (
          <button onClick={() => onFinalize(sale.id)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition">
            Mark as Final
          </button>
        )}
        <button onClick={onClose} className="ml-auto bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm transition">
          Close
        </button>
      </div>
    </Modal>
  )
}

// ===== SALE FORM =====
const SaleForm = ({ sale, customers, products, onClose, onSave }) => {
  const isEdit = !!sale?.id
  const [form, setForm] = useState({
    customerId: sale?.customerId || '',
    billDate: sale?.billDate ? new Date(sale.billDate).toISOString().split('T')[0] : today,
    paymentStatus: sale?.paymentStatus || 'Pending',
    paidAmount: sale?.paidAmount || '',
    paymentDate: sale?.paymentDate ? new Date(sale.paymentDate).toISOString().split('T')[0] : '',
    billType: sale?.billType || 'Rough'
  })
  const [items, setItems] = useState(
    sale?.items?.map(i => ({
      productId: i.productId,
      quantity: i.quantity,
      price: i.price,
      boxes: i.boxes
    })) || [{ productId: '', quantity: '', price: 0, boxes: 0 }]
  )
  const [loading, setLoading] = useState(false)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' })
  const [customerList, setCustomerList] = useState(customers)
  const [editingRate, setEditingRate] = useState({})

  const total = items.reduce((sum, item) => {
    return sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 0))
  }, 0)

  const handleProductChange = (idx, productId) => {
    const product = products.find(p => p.id === parseInt(productId))
    const newItems = [...items]
    newItems[idx] = {
      ...newItems[idx],
      productId,
      price: product?.price || 0,
      boxes: 0
    }
    setItems(newItems)
  }

  const handleQuantityChange = (idx, quantity) => {
    const newItems = [...items]
    const productId = newItems[idx].productId
    const product = products.find(p => p.id === parseInt(productId))
    newItems[idx] = { ...newItems[idx], quantity }
    setItems(newItems)
  }

  const handlePriceChange = (idx, price) => {
    const newItems = [...items]
    newItems[idx] = { ...newItems[idx], price }
    setItems(newItems)
  }

  const addItem = () => setItems([...items, { productId: '', quantity: '', price: 0, boxes: 0 }])

  const removeItem = (idx) => {
    if (items.length === 1) return toast.error('At least one item required')
    setItems(items.filter((_, i) => i !== idx))
  }

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone || !newCustomer.address) {
      return toast.error('Name, phone and address required')
    }
    try {
      const res = await createCustomer(newCustomer)
      setCustomerList([...customerList, res.data])
      setForm({ ...form, customerId: res.data.id })
      setShowAddCustomer(false)
      setNewCustomer({ name: '', phone: '', address: '' })
      toast.success('Customer added!')
    } catch {
      toast.error('Error adding customer')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.customerId) return toast.error('Please select a customer')
    if (items.some(i => !i.productId || !i.quantity)) return toast.error('Please fill all item details')

    setLoading(true)
    try {
      const payload = { ...form, items }
      let res
      if (isEdit) {
        res = await updateSale(sale.id, payload)
        toast.success('Bill updated!')
      } else {
        res = await createSale(payload)
        toast.success('Bill created!')
      }
      onSave(res.data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving bill')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={isEdit ? `Edit ${sale.billNumber}` : 'Create New Bill'} onClose={onClose} wide>
      <form onSubmit={handleSubmit}>
        {/* Customer */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
          <select value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500">
            <option value="">Select Customer</option>
            {customerList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="button" onClick={() => setShowAddCustomer(!showAddCustomer)}
            className="text-pink-600 text-sm mt-1 hover:underline">
            + Add New Customer
          </button>
        </div>

        {/* Add Customer Inline */}
        {showAddCustomer && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-700 mb-3">Add New Customer</h4>
          {[
            { label: 'Name *', field: 'name', placeholder: 'Customer name' },
            { label: 'Phone *', field: 'phone', placeholder: 'Phone number' },
            { label: 'Email (Optional)', field: 'email', placeholder: 'Email address' },
            { label: 'Address *', field: 'address', placeholder: 'Address' },
          ].map(({ label, field, placeholder }) => (
              <div className="mb-2" key={field}>
                <label className="block text-xs text-gray-600 mb-1">{label}</label>
                <input type="text" value={newCustomer[field]}
                  onChange={(e) => setNewCustomer({ ...newCustomer, [field]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-pink-500"
                />
              </div>
            ))}
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={handleAddCustomer}
                className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-1.5 rounded-lg text-sm transition">
                Save Customer
              </button>
              <button type="button" onClick={() => setShowAddCustomer(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1.5 rounded-lg text-sm transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Date */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input type="date" value={form.billDate}
            onChange={(e) => setForm({ ...form, billDate: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
          />
        </div>

        {/* Items */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Items</label>
          <div className="space-y-3">

          <div className="grid grid-cols-12 gap-2 mb-2 px-1">
            <div className="col-span-4 text-xs text-gray-500 font-medium">Product</div>
            <div className="col-span-2 text-xs text-gray-500 font-medium">Quantity</div>
            <div className="col-span-2 text-xs text-gray-500 font-medium">Rate (click to edit)</div>
            <div className="col-span-2 text-xs text-gray-500 font-medium">Amount</div>
            <div className="col-span-2"></div>
          </div>

            {items.map((item, idx) => {
              const product = products.find(p => p.id === parseInt(item.productId))
              const itemTotal = parseFloat(item.price || 0) * parseInt(item.quantity || 0)
              return (
                <div key={idx} className="bg-gray-50 rounded-lg p-3">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    {/* Product */}
                    <div className="col-span-4">
                      <select value={item.productId}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-pink-500">
                        <option value="">Select Product</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.flavor} {p.category?.name} {p.size} (Stock: {p.quantity})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2">
                      <input type="number" value={item.quantity} min="1"
                        onChange={(e) => handleQuantityChange(idx, e.target.value)}
                        placeholder="Qty"
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-pink-500"
                      />
                    </div>

                    {/* Rate */}
                    <div className="col-span-2">
                      {editingRate[idx] ? (
                        <div className="flex gap-1">
                          <input type="number" value={item.price}
                            onChange={(e) => handlePriceChange(idx, e.target.value)}
                            className="w-full border border-pink-400 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                          />
                          <button type="button" onClick={() => setEditingRate({ ...editingRate, [idx]: false })}
                            className="bg-pink-600 text-white px-2 rounded text-xs">✓</button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setEditingRate({ ...editingRate, [idx]: true })}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-left hover:border-pink-400 transition">
                          ₹{item.price}
                        </button>
                      )}
                    </div>

                    {/* Total */}
                    <div className="col-span-2 text-sm font-bold text-gray-700">
                      {formatAmount(itemTotal)}
                    </div>

                    {/* Delete */}
                    <div className="col-span-2 flex justify-end">
                      <button type="button" onClick={() => removeItem(idx)}
                        className="text-red-500 hover:text-red-600 p-1">
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Stock warning */}
                  {product && parseInt(item.quantity) > product.quantity && (
                    <p className="text-xs text-red-500 mt-1">⚠️ Quantity exceeds stock ({product.quantity} available)</p>
                  )}
                </div>
              )
            })}
          </div>

          <button type="button" onClick={addItem}
            className="mt-3 text-pink-600 hover:text-pink-700 text-sm font-medium flex items-center gap-1">
            <Plus size={16} /> Add Another Item
          </button>
        </div>

        {/* Total */}
        <div className="bg-pink-50 rounded-lg p-3 mb-4 text-right">
          <span className="text-gray-600">Total: </span>
          <span className="text-xl font-bold text-pink-600">{formatAmount(total)}</span>
        </div>

        {/* Payment Status */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
            <select value={form.paymentStatus}
              onChange={(e) => setForm({ ...form, paymentStatus: e.target.value, paymentDate: e.target.value === 'Pending' ? '' : form.paymentDate })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500">
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bill Type</label>
            <select value={form.billType}
              onChange={(e) => setForm({ ...form, billType: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500">
              <option value="Rough">Rough</option>
              <option value="Final">Final</option>
            </select>
          </div>
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
            {loading ? 'Saving...' : isEdit ? 'Update Bill' : 'Generate Bill'}
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

// ===== MAIN SALES PAGE =====
export default function Sales() {
  const [sales, setSales] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRecent, setShowRecent] = useState(true)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [markPaidSale, setMarkPaidSale] = useState(null)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async (params = { recent: 'true' }) => {
    setLoading(true)
    try {
      const [salesRes, customersRes, productsRes] = await Promise.all([
        getSales(params),
        getCustomers(),
        getProducts()
      ])
      setSales(salesRes.data)
      setCustomers(customersRes.data)
      setProducts(productsRes.data)
    } catch {
      toast.error('Error loading data')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setShowRecent(false)
    loadAll({ fromDate, toDate })
  }

  const handleAllBills = () => {
    setShowRecent(false)
    setFromDate('')
    setToDate('')
    loadAll({})
  }

  const handleRecentBills = () => {
    setShowRecent(true)
    setFromDate('')
    setToDate('')
    loadAll({ recent: 'true' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this bill? Inventory will be restored.')) return
    try {
      await deleteSale(id)
      setSales(sales.filter(s => s.id !== id))
      toast.success('Bill deleted, inventory restored')
    } catch {
      toast.error('Error deleting bill')
    }
  }

  const handleMarkPaid = async (paymentDate, paidAmount) => {
    try {
      const res = await markSalePaid(markPaidSale.id, paymentDate, paidAmount)
      setSales(sales.map(s => s.id === res.data.id ? res.data : s))
      toast.success('Payment recorded!')
      setMarkPaidSale(null)
    } catch {
      toast.error('Error recording payment')
    }
  }

  const handleFinalize = async (id) => {
    if (!confirm('Mark this bill as Final? This cannot be undone.')) return
    try {
      const res = await finalizeBill(id)
      setSales(sales.map(s => s.id === res.data.id ? res.data : s))
      toast.success('Bill finalized!')
      setModal(null)
    } catch {
      toast.error('Error finalizing bill')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-pink-600 text-lg">Loading...</div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-3xl font-bold text-pink-600">Sales &<br />Billing</h2>
        <button onClick={() => { setSelected(null); setModal('form') }}
          className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition">
          <Plus size={18} /> New Sale
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-600 mb-1">From Date</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">To Date</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500"
            />
          </div>
          <button onClick={handleSearch}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition">
            <Search size={16} /> Search
          </button>
          <button onClick={handleRecentBills}
            className={`px-4 py-2 rounded-lg text-sm transition ${showRecent ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Recent Bills
          </button>
          <button onClick={handleAllBills}
            className={`px-4 py-2 rounded-lg text-sm transition ${!showRecent && !fromDate && !toDate ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            All Bills
          </button>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Bill ID', 'Customer', 'Amount', 'Bill Date', 'Bill Type', 'Payment Status', 'Payment Date', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-sm font-semibold text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  No bills found.
                </td>
              </tr>
            ) : sales.map(sale => (
              <tr key={sale.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{sale.billNumber}</div>
                  {sale.versions?.length > 1 && (
                    <div className="text-xs text-gray-500">({sale.versions.length} versions)</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{sale.customer?.name}</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-800">{formatAmount(sale.totalAmount)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDate(sale.billDate)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    sale.billType === 'Final'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {sale.billType}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <PaymentBadge
                    status={sale.paymentStatus}
                    onMarkPaid={() => setMarkPaidSale(sale)}
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDate(sale.paymentDate)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 items-center">
                    <button onClick={() => { setSelected(sale); setModal('view') }}
                      className="text-blue-500 hover:text-blue-600 p-1 rounded transition" title="View bill">
                      <Eye size={16} />
                    </button>
                    <div className="w-6 flex justify-center">
                      {sale.billType === 'Rough' && (
                        <button onClick={() => { setSelected(sale); setModal('form') }}
                          className="text-pink-600 hover:text-pink-700 p-1 rounded transition" title="Edit bill">
                          <Pencil size={16} />
                        </button>
                      )}
                    </div>
                    <button onClick={() => handleDelete(sale.id)}
                      className="text-red-500 hover:text-red-600 p-1 rounded transition" title="Delete bill">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Modals */}
      {modal === 'form' && (
        <SaleForm
          sale={selected}
          customers={customers}
          products={products}
          onClose={() => setModal(null)}
          onSave={() => {
            setModal(null)
            loadAll(showRecent ? { recent: 'true' } : { fromDate, toDate })
            }}
        />
      )}

      {modal === 'view' && selected && (
        <BillViewModal
          sale={selected}
          onClose={() => setModal(null)}
          onFinalize={handleFinalize}
        />
      )}

      {markPaidSale && (
        <MarkPaidModal
          sale={markPaidSale}
          onClose={() => setMarkPaidSale(null)}
          onConfirm={handleMarkPaid}
        />
      )}
    </div>
  )
}