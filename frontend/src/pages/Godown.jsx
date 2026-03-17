import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, History, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getMaterials, getMaterialNames, addMaterial,
  updateMaterial, deleteMaterial, addUsage, getUsageHistory
} from '../api/godown'

const UNITS = ['kg', 'g', 'liters', 'ml', 'pieces', 'boxes', 'packets']

// ===== MODAL =====
const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className={`bg-white rounded-xl shadow-xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} mx-4 max-h-[90vh] overflow-y-auto`}>
      <div className="flex justify-between items-center p-5 border-b">
        <h3 className="text-lg font-bold text-pink-600">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
)

// ===== ADD/EDIT MATERIAL MODAL =====
const MaterialModal = ({ material, materialNames, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: material?.name || '',
    availableQuantity: material?.availableQuantity || '',
    unit: material?.unit || ''
  })
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const isEdit = !!material

  const handleNameChange = (value) => {
    setForm({ ...form, name: value })
    if (!isEdit && value.length > 0) {
      const filtered = materialNames.filter(n =>
        n.toLowerCase().includes(value.toLowerCase())
      )
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.availableQuantity || !form.unit) {
      return toast.error('All fields are required')
    }
    setLoading(true)
    try {
      let res
      if (isEdit) {
        res = await updateMaterial(material.id, form)
        toast.success('Material updated!')
      } else {
        res = await addMaterial(form)
        if (res.data.isExisting) {
          toast.success(`Stock added to existing "${form.name}"!`)
        } else {
          toast.success('New material added!')
        }
      }
      onSave(res.data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving material')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Edit Material' : 'Add Material to Godown'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="mb-4 relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Material Name *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Enter material name (e.g., Sugar, Milk Powder)"
            disabled={isEdit}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500 disabled:bg-gray-50"
          />
          {showSuggestions && (
            <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
              {suggestions.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setForm({ ...form, name: s })
                    setShowSuggestions(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-pink-50 text-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {!isEdit && (
            <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
              ℹ️ If material already exists, quantity will be added to existing stock
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Available Quantity *
          </label>
          <input
            type="number"
            value={form.availableQuantity}
            onChange={(e) => setForm({ ...form, availableQuantity: e.target.value })}
            placeholder="Current stock quantity"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
          />
          {!isEdit && (
            <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
              ℹ️ Enter the quantity you want to add
            </p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
          <select
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            disabled={isEdit}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500 disabled:bg-gray-50"
          >
            <option value="">Select Unit</option>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg font-medium transition">
            {loading ? 'Saving...' : 'Save Material'}
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

// ===== HISTORY MODAL =====
const HistoryModal = ({ material, onClose }) => {
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getUsageHistory(material.id)
        setHistory(res.data)
      } catch {
        toast.error('Error loading history')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [material.id])

  // Group history by date
  const groupByDate = (usageHistory) => {
    const groups = {}
    usageHistory.forEach(entry => {
      const date = new Date(entry.date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
      if (!groups[date]) groups[date] = []
      groups[date].push(entry)
    })
    return groups
  }

  return (
    <Modal title={`Usage History - ${material.name}`} onClose={onClose} wide>
      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : !history || history.usageHistory.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No usage history found.</div>
      ) : (
        <div>
          {/* Table Header */}
          <div className="grid grid-cols-3 bg-blue-500 text-white rounded-lg px-4 py-3 mb-2 text-sm font-medium">
            <span>#</span>
            <span>Date</span>
            <span>Quantity Used</span>
          </div>

          {Object.entries(groupByDate(history.usageHistory)).map(([date, entries]) => {
            const dateTotal = entries.reduce((sum, e) => sum + e.quantity, 0)
            return (
              <div key={date} className="mb-3">
                {/* Date Header */}
                <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg mb-1">
                  <span>📅</span>
                  <span className="font-medium text-sm text-gray-700">
                    {date} - Total: {dateTotal.toFixed(2)} {material.unit}
                  </span>
                </div>
                {/* Entries */}
                {entries.map((entry, idx) => (
                  <div key={entry.id} className="grid grid-cols-3 px-4 py-2 border-b text-sm hover:bg-gray-50">
                    <span className="text-gray-500 pl-4">{idx + 1}</span>
                    <span className="text-gray-700">{new Date(entry.date).toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}</span>
                    <span className="font-bold text-gray-700">{entry.quantity.toFixed(2)} {material.unit}</span>
                  </div>
                ))}
              </div>
            )
          })}

          {/* Total Summary */}
          <div className="bg-gray-200 px-4 py-3 rounded-lg text-center font-bold text-gray-700 mt-3">
            📊 Total Usage: {history.usageHistory.reduce((sum, e) => sum + e.quantity, 0).toFixed(2)} {material.unit}
            ({history.usageHistory.length} entries)
          </div>

          <div className="text-center mt-4">
            <button onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition">
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ===== MAIN GODOWN PAGE =====
export default function Godown() {
  const [materials, setMaterials] = useState([])
  const [materialNames, setMaterialNames] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [usageInputs, setUsageInputs] = useState({})
  const searchTimeout = useRef(null)

  useEffect(() => {
    loadMaterials()
    loadNames()
  }, [])

  const loadMaterials = async (searchTerm = '') => {
    setLoading(true)
    try {
      const res = await getMaterials(searchTerm)
      setMaterials(res.data)
    } catch {
      toast.error('Error loading materials')
    } finally {
      setLoading(false)
    }
  }

  const loadNames = async () => {
    try {
      const res = await getMaterialNames()
      setMaterialNames(res.data)
    } catch {}
  }

  const handleSearch = (value) => {
    setSearch(value)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      loadMaterials(value)
    }, 300)
  }

  const handleAddUsage = async (material) => {
    const qty = parseFloat(usageInputs[material.id] || 0)
    if (!qty || qty <= 0) return toast.error('Enter a valid quantity')

    try {
      const res = await addUsage(material.id, qty)
      setMaterials(materials.map(m => m.id === material.id ? res.data : m))
      setUsageInputs({ ...usageInputs, [material.id]: '' })
      toast.success(`${qty} ${material.unit} used`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding usage')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this material and all its usage history?')) return
    try {
      await deleteMaterial(id)
      setMaterials(materials.filter(m => m.id !== id))
      toast.success('Material deleted')
    } catch {
      toast.error('Error deleting material')
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
      <div className="flex items-start justify-between mb-6">
        <h2 className="text-3xl font-bold text-pink-600">Raw Material<br />(Godown)</h2>
        <button
          onClick={() => { setSelected(null); setModal('add') }}
          className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition"
        >
          <Plus size={18} /> Add New Material
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by material name..."
          className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-pink-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Material Name', 'Available Quantity', 'Today Used', 'Total Used', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-sm font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {materials.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400">
                  No materials found. Add your first material!
                </td>
              </tr>
            ) : materials.map(material => (
              <tr key={material.id} className="border-b hover:bg-gray-50 transition">
                {/* Material Name */}
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-800">{material.name}</div>
                  <div className="text-xs text-gray-500">Unit: {material.unit}</div>
                </td>

                {/* Available Quantity */}
                <td className="px-4 py-3">
                  <span className={`font-bold text-lg ${material.availableQuantity <= 0 ? 'text-red-500' : 'text-gray-700'}`}>
                    {material.availableQuantity}
                  </span>
                  <span className="text-gray-500 ml-1">{material.unit}</span>
                </td>

                {/* Today Used - Input + Add button */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={usageInputs[material.id] || ''}
                      onChange={(e) => setUsageInputs({ ...usageInputs, [material.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddUsage(material)}
                      placeholder="0"
                      className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-center focus:outline-none focus:border-pink-500"
                    />
                    <button
                      onClick={() => handleAddUsage(material)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg text-sm transition"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Today: {material.todayUsed} {material.unit}
                  </div>
                </td>

                {/* Total Used + History */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700">{material.totalUsed}</span>
                    <span className="text-gray-500">{material.unit}</span>
                    <button
                      onClick={() => { setSelected(material); setModal('history') }}
                      className="bg-gray-200 hover:bg-gray-300 p-1.5 rounded-lg transition"
                      title="View usage history"
                    >
                      <History size={14} />
                    </button>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSelected(material); setModal('edit') }}
                      className="text-pink-600 hover:text-pink-700 p-1 rounded transition"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(material.id)}
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
      </div>

      {/* Modals */}
      {(modal === 'add' || modal === 'edit') && (
        <MaterialModal
          material={modal === 'edit' ? selected : null}
          materialNames={materialNames}
          onClose={() => setModal(null)}
          onSave={(saved) => {
            if (modal === 'edit') {
              setMaterials(materials.map(m => m.id === saved.id ? saved : m))
            } else {
              const exists = materials.find(m => m.id === saved.id)
              if (exists) {
                setMaterials(materials.map(m => m.id === saved.id ? saved : m))
              } else {
                setMaterials([...materials, saved].sort((a, b) => a.name.localeCompare(b.name)))
              }
              loadNames()
            }
            setModal(null)
          }}
        />
      )}

      {modal === 'history' && selected && (
        <HistoryModal
          material={selected}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}