import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { getWorkers, createWorker, updateWorker, deleteWorker, getAttendance, saveAttendance } from '../api/workers'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

const formatAmount = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`

// ===== MODAL =====
const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className={`bg-white rounded-xl shadow-xl w-full ${wide ? 'max-w-3xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}>
      <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white">
        <h3 className="text-lg font-bold text-pink-600">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
)

// ===== WORKER FORM =====
const WorkerForm = ({ worker, workerType, onClose, onSave }) => {
  const isEdit = !!worker?.id
  const showTypeField = workerType === 'operator' || workerType === 'manager'
  const typeLabel = workerType === 'labour' ? 'Labour' : workerType === 'operator' ? 'Operator' : 'Manager'

  const [form, setForm] = useState({
    name: worker?.name || '',
    mobile: worker?.mobile || '',
    workerType: worker?.workerType || '',
    salaryPerMonth: worker?.salaryPerMonth || '',
    address: worker?.address || ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.mobile || !form.salaryPerMonth) {
      return toast.error('Name, mobile and salary are required')
    }
    setLoading(true)
    try {
      let res
      if (isEdit) {
        res = await updateWorker(worker.id, { ...form, type: workerType })
        toast.success('Worker updated!')
      } else {
        res = await createWorker({ ...form, type: workerType })
        toast.success('Worker added!')
      }
      onSave(res.data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving worker')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={isEdit ? `Edit ${typeLabel}` : `Add New ${typeLabel}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">{typeLabel} Name *</label>
          <input type="text" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={`Enter ${typeLabel.toLowerCase()} name`}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
          <input type="text" value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            placeholder="Enter mobile number"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
          />
        </div>

        {showTypeField && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <input type="text" value={form.workerType}
              onChange={(e) => setForm({ ...form, workerType: e.target.value })}
              placeholder="e.g., Machinery, Quality Control, HR, Factory"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Salary per Month (₹) *</label>
          <input type="number" value={form.salaryPerMonth}
            onChange={(e) => setForm({ ...form, salaryPerMonth: e.target.value })}
            placeholder="Monthly salary amount"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address (Optional)</label>
          <input type="text" value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Enter address"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg font-medium transition">
            {loading ? 'Saving...' : isEdit ? `Save ${typeLabel}` : `Save ${typeLabel}`}
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

// ===== ATTENDANCE MODAL =====
const AttendanceModal = ({ worker, onClose }) => {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAttendance()
  }, [year, month])

  const loadAttendance = async () => {
    setLoading(true)
    try {
      const res = await getAttendance(worker.id, year, month)
      const map = {}
      res.data.forEach(a => {
        const day = new Date(a.date).getDate()
        map[day] = a.status
      })
      setAttendance(map)
    } catch {
      toast.error('Error loading attendance')
    } finally {
      setLoading(false)
    }
  }

  const toggleDay = (day) => {
    const current = attendance[day]
    if (!current) {
      setAttendance({ ...attendance, [day]: 'present' })
    } else if (current === 'present') {
      setAttendance({ ...attendance, [day]: 'absent' })
    } else {
      const newAtt = { ...attendance }
      delete newAtt[day]
      setAttendance(newAtt)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const records = Object.entries(attendance).map(([day, status]) => ({
        date: new Date(year, month - 1, parseInt(day)).toISOString(),
        status
      }))
      await saveAttendance(worker.id, { attendance: records, year, month })
      toast.success('Attendance saved!')
      onClose()
    } catch {
      toast.error('Error saving attendance')
    } finally {
      setSaving(false)
    }
  }

  const prevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12) }
    else setMonth(month - 1)
  }

  const nextMonth = () => {
    if (month === 12) { setYear(year + 1); setMonth(1) }
    else setMonth(month + 1)
  }

  // Calendar calculations
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDay = new Date(year, month - 1, 1).getDay()
  const totalDays = daysInMonth
  const daysPresent = Object.values(attendance).filter(s => s === 'present').length
  const daysAbsent = Object.values(attendance).filter(s => s === 'absent').length
  const salary = Math.round((daysPresent / totalDays) * worker.salaryPerMonth)

  return (
    <Modal title={`Attendance for ${worker.name} (${worker.type === 'labour' ? 'Labour' : worker.workerType || worker.type})`} onClose={onClose} wide>
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500">Monthly Salary</div>
          <div className="font-bold text-gray-800">{formatAmount(worker.salaryPerMonth)}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500">Total Present</div>
          <div className="font-bold text-green-600">{daysPresent} days</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500">Total Absent</div>
          <div className="font-bold text-red-600">{daysAbsent} days</div>
        </div>
        <div className="bg-pink-50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500">Salary This Month</div>
          <div className="font-bold text-pink-600">{formatAmount(salary)}</div>
        </div>
      </div>
      

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg text-sm transition">
          ← Previous
        </button>
        <div className="font-bold text-gray-800">{MONTHS[month - 1]} {year}</div>
        <button onClick={nextMonth} className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg text-sm transition">
          Next →
        </button>
      </div>

      {/* Month + Year Dropdowns */}
      <div className="flex gap-2 mb-4 justify-center">
        <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-pink-500">
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
       <input
          type="number"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          min="2000"
          max="2099"
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-pink-500 w-24"
        />
      </div>


      {/* Calendar */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : (
        <div className="mb-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-500 py-1">{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for first week */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const status = attendance[day]
              return (
                <button key={day} onClick={() => toggleDay(day)}
                  className={`aspect-square rounded-lg text-sm font-medium transition flex items-center justify-center
                    ${status === 'present' ? 'bg-green-500 text-white' :
                      status === 'absent' ? 'bg-red-400 text-white' :
                      'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                  {day}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500"></div> Present</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-400"></div> Absent</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-gray-100 border"></div> Not marked</div>
            <div className="text-gray-400 ml-2">Click to toggle: unmarked → present → absent → unmarked</div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg font-medium transition">
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
        <button onClick={onClose}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition">
          Close
        </button>
      </div>
    </Modal>
  )
}

// ===== WORKERS TABLE =====
const WorkersTable = ({ workers, workerType, onEdit, onDelete, onAttendance }) => {
  const showTypeCol = workerType === 'operator' || workerType === 'manager'

  if (workers.length === 0) return (
    <div className="text-center py-12 text-gray-400">
      No {workerType}s found. Add your first {workerType}!
    </div>
  )

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Name</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Mobile Number</th>
            {showTypeCol && <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Type</th>}
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Salary/Month</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Attendance (This Month)</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Salary This Month</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {workers.map(worker => (
            <tr key={worker.id} className="border-b hover:bg-gray-50 transition">
              <td className="px-4 py-3 font-medium text-gray-800">{worker.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{worker.mobile}</td>
              {showTypeCol && <td className="px-4 py-3 text-sm text-gray-600">{worker.workerType || '-'}</td>}
              <td className="px-4 py-3 text-sm font-medium text-gray-700">{formatAmount(worker.salaryPerMonth)}</td>
              <td className="px-4 py-3 text-sm text-gray-600">
                <span className="text-green-600">{worker.daysPresent} days present</span>
                <span className="text-gray-400">, </span>
                <span className="text-red-500">{worker.daysAbsent} days absent</span>
              </td>
              <td className="px-4 py-3 text-sm font-bold text-pink-600">{formatAmount(worker.salaryThisMonth)}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button onClick={() => onAttendance(worker)}
                    className="text-blue-500 hover:text-blue-600 p-1 rounded transition" title="Attendance">
                    <Calendar size={16} />
                  </button>
                  <button onClick={() => onEdit(worker)}
                    className="text-pink-600 hover:text-pink-700 p-1 rounded transition">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => onDelete(worker.id)}
                    className="text-red-500 hover:text-red-600 p-1 rounded transition">
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
  )
}

// ===== MAIN WORKERS PAGE =====
export default function Workers() {
  const [tab, setTab] = useState('labour')
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [attendanceWorker, setAttendanceWorker] = useState(null)

  useEffect(() => { loadWorkers() }, [tab])

  const loadWorkers = async () => {
    setLoading(true)
    try {
      const res = await getWorkers(tab)
      setWorkers(res.data)
    } catch {
      toast.error('Error loading workers')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this worker?')) return
    try {
      await deleteWorker(id)
      setWorkers(workers.filter(w => w.id !== id))
      toast.success('Worker deleted')
    } catch {
      toast.error('Error deleting worker')
    }
  }

  const tabs = [
    { id: 'labour', label: 'Labour' },
    { id: 'operator', label: 'Operators' },
    { id: 'manager', label: 'Manager' }
  ]

  const tabWorkers = workers.filter(w => w.type === tab)

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
          <h2 className="text-3xl font-bold text-pink-600">Workers</h2>
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

        <button onClick={() => { setSelected(null); setModal('form') }}
          className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition">
          <Plus size={18} />
          Add New {tab === 'labour' ? 'Labour' : tab === 'operator' ? 'Operator' : 'Manager'}
        </button>
      </div>

      {/* Table */}
      <WorkersTable
        workers={tabWorkers}
        workerType={tab}
        onEdit={(w) => { setSelected(w); setModal('form') }}
        onDelete={handleDelete}
        onAttendance={(w) => setAttendanceWorker(w)}
      />

      {/* Worker Form Modal */}
      {modal === 'form' && (
        <WorkerForm
          worker={selected}
          workerType={tab}
          onClose={() => setModal(null)}
          onSave={(saved) => {
            if (selected) {
              setWorkers(workers.map(w => w.id === saved.id ? saved : w))
            } else {
              setWorkers([...workers, saved])
            }
            setModal(null)
          }}
        />
      )}

      {/* Attendance Modal */}
      {attendanceWorker && (
        <AttendanceModal
          worker={attendanceWorker}
          onClose={() => {
            setAttendanceWorker(null)
            loadWorkers()
          }}
        />
      )}
    </div>
  )
}