import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Truck, User, X } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getTransports, createTransport, updateTransport, deleteTransport, cycleStatus,
  getVehicles, createVehicle, updateVehicle, deleteVehicle,
  getDrivers, createDriver, updateDriver, deleteDriver,
  getRecentBills
} from '../api/transport'

const today = new Date().toISOString().split('T')[0]
const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN') : '-'

const VEHICLE_TYPES = ['4 Wheeler', 'Car', '2 Wheeler', 'Tempo', 'Mini Truck', 'Truck', 'Refrigerated Van']
const STATUS_COLORS = {
  'Scheduled': 'bg-blue-100 text-blue-700',
  'In Transit': 'bg-yellow-100 text-yellow-700',
  'Delivered': 'bg-green-100 text-green-700',
  'Cancelled': 'bg-red-100 text-red-700'
}

// ===== MODAL =====
const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className={`bg-white rounded-xl shadow-xl w-full ${wide ? 'max-w-3xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}>
      <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white">
        <h3 className="text-lg font-bold text-pink-600">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
)

// ===== VEHICLE FORM =====
const VehicleForm = ({ vehicle, onClose, onSave }) => {
  const isEdit = !!vehicle?.id
  const [form, setForm] = useState({
    vehicleNumber: vehicle?.vehicleNumber || '',
    vehicleType: vehicle?.vehicleType || '',
    ownerName: vehicle?.ownerName || '',
    ownerPhone: vehicle?.ownerPhone || '',
    ownerEmail: vehicle?.ownerEmail || '',
    ownerAddress: vehicle?.ownerAddress || ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let res
      if (isEdit) {
        res = await updateVehicle(vehicle.id, form)
        toast.success('Vehicle updated!')
      } else {
        res = await createVehicle(form)
        toast.success('Vehicle added!')
      }
      onSave(res.data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving vehicle')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={isEdit ? `Edit Vehicle ${vehicle.vehicleNumber}` : 'Add New Vehicle'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
          <input type="text" value={form.vehicleNumber}
            onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
            placeholder="e.g., MH01AB1234"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
          <select value={form.vehicleType}
            onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500">
            <option value="">Select Vehicle Type</option>
            {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {[
          { label: 'Owner Name', field: 'ownerName', placeholder: 'Owner full name' },
          { label: 'Owner Phone', field: 'ownerPhone', placeholder: 'Phone number' },
          { label: 'Owner Email', field: 'ownerEmail', placeholder: 'Email (optional)' },
          { label: 'Owner Address', field: 'ownerAddress', placeholder: 'Complete address' },
        ].map(({ label, field, placeholder }) => (
          <div className="mb-3" key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input type="text" value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              placeholder={placeholder}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
            />
          </div>
        ))}
        <div className="flex gap-3 mt-4">
          <button type="submit" disabled={loading}
            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg font-medium transition">
            {loading ? 'Saving...' : isEdit ? 'Update Vehicle' : 'Save Vehicle'}
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

// ===== DRIVER FORM =====
const DriverForm = ({ driver, onClose, onSave }) => {
  const isEdit = !!driver?.id
  const [form, setForm] = useState({
    name: driver?.name || '',
    phone: driver?.phone || '',
    email: driver?.email || '',
    address: driver?.address || '',
    licenseNumber: driver?.licenseNumber || ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let res
      if (isEdit) {
        res = await updateDriver(driver.id, form)
        toast.success('Driver updated!')
      } else {
        res = await createDriver(form)
        toast.success('Driver added!')
      }
      onSave(res.data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving driver')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={isEdit ? `Edit Driver ${driver.name}` : 'Add New Driver'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {[
          { label: 'Driver Name', field: 'name', placeholder: 'Full name' },
          { label: 'Phone Number', field: 'phone', placeholder: 'Phone number' },
          { label: 'Email', field: 'email', placeholder: 'Email (optional)' },
          { label: 'Address', field: 'address', placeholder: 'Complete address' },
          { label: 'License Number (Optional)', field: 'licenseNumber', placeholder: 'License number' },
        ].map(({ label, field, placeholder }) => (
          <div className="mb-3" key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input type="text" value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              placeholder={placeholder}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
            />
          </div>
        ))}
        <div className="flex gap-3 mt-4">
          <button type="submit" disabled={loading}
            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg font-medium transition">
            {loading ? 'Saving...' : isEdit ? 'Update Driver' : 'Save Driver'}
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

// ===== VEHICLES MODAL =====
const VehiclesModal = ({ onClose }) => {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => { loadVehicles() }, [])

  const loadVehicles = async () => {
    setLoading(true)
    try {
      const res = await getVehicles()
      setVehicles(res.data)
    } catch {
      toast.error('Error loading vehicles')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this vehicle?')) return
    try {
      await deleteVehicle(id)
      setVehicles(vehicles.filter(v => v.id !== id))
      toast.success('Vehicle deleted')
    } catch {
      toast.error('Error deleting vehicle')
    }
  }

  return (
    <Modal title="Vehicle Details" onClose={onClose} wide>
      <div className="flex justify-end mb-4">
        <button onClick={() => { setSelected(null); setModal('form') }}
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition">
          <Plus size={16} /> Add New Vehicle
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Vehicle No', 'Type', 'Owner Name', 'Contact', 'Address', 'Actions'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No vehicles found.</td></tr>
              ) : vehicles.map(v => (
                <tr key={v.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm font-medium">{v.vehicleNumber}</td>
                  <td className="px-3 py-2 text-sm">{v.vehicleType}</td>
                  <td className="px-3 py-2 text-sm">{v.ownerName}</td>
                  <td className="px-3 py-2 text-sm">{v.ownerPhone}</td>
                  <td className="px-3 py-2 text-sm">{v.ownerAddress}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => { setSelected(v); setModal('form') }}
                        className="text-pink-600 hover:text-pink-700 p-1"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(v.id)}
                        className="text-red-500 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal === 'form' && (
        <VehicleForm
          vehicle={selected}
          onClose={() => setModal(null)}
          onSave={(saved) => {
            if (selected) setVehicles(vehicles.map(v => v.id === saved.id ? saved : v))
            else setVehicles([...vehicles, saved])
            setModal(null)
          }}
        />
      )}
    </Modal>
  )
}

// ===== DRIVERS MODAL =====
const DriversModal = ({ onClose }) => {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => { loadDrivers() }, [])

  const loadDrivers = async () => {
    setLoading(true)
    try {
      const res = await getDrivers()
      setDrivers(res.data)
    } catch {
      toast.error('Error loading drivers')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this driver?')) return
    try {
      await deleteDriver(id)
      setDrivers(drivers.filter(d => d.id !== id))
      toast.success('Driver deleted')
    } catch {
      toast.error('Error deleting driver')
    }
  }

  return (
    <Modal title="Driver Details" onClose={onClose} wide>
      <div className="flex justify-end mb-4">
        <button onClick={() => { setSelected(null); setModal('form') }}
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition">
          <Plus size={16} /> Add New Driver
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Driver Name', 'Phone', 'Email', 'Address', 'License', 'Actions'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No drivers found.</td></tr>
              ) : drivers.map(d => (
                <tr key={d.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm font-medium">{d.name}</td>
                  <td className="px-3 py-2 text-sm">{d.phone}</td>
                  <td className="px-3 py-2 text-sm">{d.email || 'N/A'}</td>
                  <td className="px-3 py-2 text-sm">{d.address}</td>
                  <td className="px-3 py-2 text-sm">{d.licenseNumber || 'N/A'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => { setSelected(d); setModal('form') }}
                        className="text-pink-600 hover:text-pink-700 p-1"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(d.id)}
                        className="text-red-500 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal === 'form' && (
        <DriverForm
          driver={selected}
          onClose={() => setModal(null)}
          onSave={(saved) => {
            if (selected) setDrivers(drivers.map(d => d.id === saved.id ? saved : d))
            else setDrivers([...drivers, saved])
            setModal(null)
          }}
        />
      )}
    </Modal>
  )
}

// ===== TRANSPORT FORM =====
const TransportForm = ({ transport, onClose, onSave }) => {
  const isEdit = !!transport?.id
  const [form, setForm] = useState({
    saleId: transport?.saleId || '',
    customerId: transport?.customerId || '',
    customerName: transport?.customerName || '',
    vehicleType: transport?.vehicleType || '',
    vehicleNumber: transport?.vehicleNumber || '',
    vehicleId: transport?.vehicleId || '',
    driverId: transport?.driverId || '',
    driverName: transport?.driverName || '',
    fromLocation: transport?.fromLocation || '',
    toLocation: transport?.toLocation || '',
    transportDate: transport?.transportDate ? new Date(transport.transportDate).toISOString().split('T')[0] : today,
    quantity: transport?.quantity || '',
    status: transport?.status || 'Scheduled',
    billItems: transport?.billItems || null
  })
  const [recentBills, setRecentBills] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddDriver, setShowAddDriver] = useState(false)
  const [newDriver, setNewDriver] = useState({ name: '', phone: '', address: '' })

  useEffect(() => {
    Promise.all([getRecentBills(), getDrivers()]).then(([billsRes, driversRes]) => {
      setRecentBills(billsRes.data)
      setDrivers(driversRes.data)
    })
  }, [])

  const handleBillSelect = (billId) => {
    if (!billId) {
      setForm({ ...form, saleId: '', customerId: '', customerName: '', billItems: null })
      return
    }
    const bill = recentBills.find(b => b.id === parseInt(billId))
    if (bill) {
      setForm({
        ...form,
        saleId: bill.id,
        customerId: bill.customerId,
        customerName: bill.customer?.name || '',
        billItems: bill.items,
        quantity: bill.items.reduce((sum, item) => sum + item.quantity, 0)
      })
    }
  }

  const handleAddDriver = async () => {
    if (!newDriver.name || !newDriver.phone || !newDriver.address) {
      return toast.error('Name, phone and address required')
    }
    try {
      const res = await createDriver(newDriver)
      setDrivers([...drivers, res.data])
      setForm({ ...form, driverId: res.data.id, driverName: res.data.name })
      setShowAddDriver(false)
      setNewDriver({ name: '', phone: '', address: '' })
      toast.success('Driver added!')
    } catch {
      toast.error('Error adding driver')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.fromLocation || !form.toLocation || !form.transportDate) {
      return toast.error('From location, To location and date are required')
    }
    setLoading(true)
    try {
      let res
      if (isEdit) {
        res = await updateTransport(transport.id, form)
        toast.success('Transport updated!')
      } else {
        res = await createTransport(form)
        toast.success('Transport created!')
      }
      onSave(res.data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving transport')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Edit Transport Record' : 'Create New Transport Record'} onClose={onClose} wide>
      <form onSubmit={handleSubmit}>
        {/* Bill Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Bill (Optional)</label>
          <select value={form.saleId}
            onChange={(e) => handleBillSelect(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500">
            <option value="">Select Bill</option>
            {recentBills.length === 0
              ? <option disabled>No recent bills found (today/yesterday)</option>
              : recentBills.map(b => (
                <option key={b.id} value={b.id}>{b.billNumber} — {b.customer?.name} — ₹{b.totalAmount}</option>
              ))
            }
          </select>
        </div>

        {/* Customer */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
          <input type="text" value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            placeholder="Customer name (auto-filled from bill)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
          />
        </div>

        {/* Bill Items */}
        {form.billItems && Array.isArray(form.billItems) && form.billItems.length > 0 && (
          <div className="mb-4 bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-600 mb-2">Bill Items:</div>
            {form.billItems.map((item, idx) => (
              <div key={idx} className="text-xs text-gray-600">
                {item.product?.flavor} {item.product?.category?.name} {item.product?.size} — Qty: {item.quantity}
              </div>
            ))}
          </div>
        )}

        {/* Vehicle Type + Number */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
            <select value={form.vehicleType}
              onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500">
              <option value="">Select Vehicle Type</option>
              {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
            <input type="text" value={form.vehicleNumber}
              onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
              placeholder="e.g., MH01AB1234"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>

        {/* Driver */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
          <select value={form.driverId}
            onChange={(e) => {
              const driver = drivers.find(d => d.id === parseInt(e.target.value))
              setForm({ ...form, driverId: e.target.value, driverName: driver?.name || '' })
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500">
            <option value="">Select Driver</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button type="button" onClick={() => setShowAddDriver(!showAddDriver)}
            className="text-pink-600 text-sm mt-1 hover:underline">
            + Add New Driver
          </button>
        </div>

        {/* Add Driver Inline */}
        {showAddDriver && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-700 mb-3">Add New Driver</h4>
            {[
              { label: 'Name *', field: 'name' },
              { label: 'Phone *', field: 'phone' },
              { label: 'Address *', field: 'address' },
            ].map(({ label, field }) => (
              <div className="mb-2" key={field}>
                <label className="block text-xs text-gray-600 mb-1">{label}</label>
                <input type="text" value={newDriver[field]}
                  onChange={(e) => setNewDriver({ ...newDriver, [field]: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-pink-500"
                />
              </div>
            ))}
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={handleAddDriver}
                className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-1.5 rounded-lg text-sm transition">
                Save Driver
              </button>
              <button type="button" onClick={() => setShowAddDriver(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1.5 rounded-lg text-sm transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* From + To */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Location</label>
            <input type="text" value={form.fromLocation}
              onChange={(e) => setForm({ ...form, fromLocation: e.target.value })}
              placeholder="Departure location"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Location</label>
            <input type="text" value={form.toLocation}
              onChange={(e) => setForm({ ...form, toLocation: e.target.value })}
              placeholder="Destination"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>

        {/* Date + Quantity */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transport Date</label>
            <input type="date" value={form.transportDate}
              onChange={(e) => setForm({ ...form, transportDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ice Cream Quantity (Units)</label>
            <input type="number" value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder="Total units"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>

        {/* Status */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div className="flex gap-2 flex-wrap">
            {['Scheduled', 'In Transit', 'Delivered', 'Cancelled'].map(s => (
              <button key={s} type="button"
                onClick={() => setForm({ ...form, status: s })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  form.status === s ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg font-medium transition">
            {loading ? 'Saving...' : 'Save Transport'}
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

// ===== MAIN TRANSPORT PAGE =====
export default function Transport() {
  const [transports, setTransports] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => { loadTransports() }, [])

  const loadTransports = async () => {
    setLoading(true)
    try {
      const res = await getTransports()
      setTransports(res.data)
    } catch {
      toast.error('Error loading transport records')
    } finally {
      setLoading(false)
    }
  }

  const handleCycleStatus = async (id) => {
    try {
      const res = await cycleStatus(id)
      setTransports(transports.map(t => t.id === res.data.id ? res.data : t))
    } catch {
      toast.error('Error updating status')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this transport record?')) return
    try {
      await deleteTransport(id)
      setTransports(transports.filter(t => t.id !== id))
      toast.success('Transport deleted')
    } catch {
      toast.error('Error deleting transport')
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
        <h2 className="text-3xl font-bold text-pink-600">Transport</h2>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setModal('vehicles')}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition">
            <Truck size={16} /> Vehicle Details
          </button>
          <button onClick={() => setModal('drivers')}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition">
            <User size={16} /> Driver Details
          </button>
          <button onClick={() => { setSelected(null); setModal('form') }}
            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition">
            <Plus size={18} /> New Transport
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['#', 'Vehicle', 'Driver', 'Route', 'Date', 'Qty', 'Bill', 'Customer', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transports.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-gray-400">
                  No transport records found.
                </td>
              </tr>
            ) : transports.map(t => (
              <tr key={t.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-3 py-3 text-sm text-gray-500">{t.id}</td>
                <td className="px-3 py-3 text-sm">
                  <div className="font-medium text-gray-700">{t.vehicleNumber || '-'}</div>
                  <div className="text-xs text-gray-500">{t.vehicleType || '-'}</div>
                </td>
                <td className="px-3 py-3 text-sm text-gray-600">{t.driverName || t.driver?.name || '-'}</td>
                <td className="px-3 py-3 text-sm">
                  <div className="text-gray-700">{t.fromLocation}</div>
                  <div className="text-xs text-gray-500">→ {t.toLocation}</div>
                </td>
                <td className="px-3 py-3 text-sm text-gray-600">{formatDate(t.transportDate)}</td>
                <td className="px-3 py-3 text-sm text-gray-700">{t.quantity}</td>
                <td className="px-3 py-3 text-sm text-gray-600">{t.sale?.billNumber || '-'}</td>
                <td className="px-3 py-3 text-sm text-gray-600">{t.customerName || t.customer?.name || t.sale?.customer?.name || '-'}</td>
                <td className="px-3 py-3">
                  <button onClick={() => handleCycleStatus(t.id)}
                    className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 transition ${STATUS_COLORS[t.status] || 'bg-gray-100 text-gray-600'}`}>
                    {t.status}
                  </button>
                </td>
                <td className="px-3 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => { setSelected(t); setModal('form') }}
                      className="text-pink-600 hover:text-pink-700 p-1"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(t.id)}
                      className="text-red-500 hover:text-red-600 p-1"><Trash2 size={14} /></button>
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
        <TransportForm
          transport={selected}
          onClose={() => setModal(null)}
          onSave={(saved) => {
            if (selected) setTransports(transports.map(t => t.id === saved.id ? saved : t))
            else setTransports([saved, ...transports])
            setModal(null)
          }}
        />
      )}

      {modal === 'vehicles' && <VehiclesModal onClose={() => setModal(null)} />}
      {modal === 'drivers' && <DriversModal onClose={() => setModal(null)} />}
    </div>
  )
}