const prisma = require('../prismaClient')

const getWorkers = async (req, res) => {
  try {
    const { type } = req.query
    const where = type ? { type } : {}

    const workers = await prisma.worker.findMany({
      where,
      include: { attendance: true },
      orderBy: { name: 'asc' }
    })

    // Calculate this month's attendance and salary
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const totalDays = monthEnd.getDate()

    const result = workers.map(worker => {
      const thisMonthAttendance = worker.attendance.filter(a => {
        const d = new Date(a.date)
        return d >= monthStart && d <= monthEnd
      })
      const daysPresent = thisMonthAttendance.filter(a => a.status === 'present').length
      const daysAbsent = thisMonthAttendance.filter(a => a.status === 'absent').length
      const salaryThisMonth = (daysPresent / totalDays) * worker.salaryPerMonth

      return {
        ...worker,
        daysPresent,
        daysAbsent,
        salaryThisMonth: Math.round(salaryThisMonth)
      }
    })

    res.json(result)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const createWorker = async (req, res) => {
  try {
    const { name, mobile, type, workerType, salaryPerMonth, address } = req.body
    if (!name || !mobile || !salaryPerMonth || !type) {
      return res.status(400).json({ message: 'Name, mobile, salary and type are required' })
    }
    const worker = await prisma.worker.create({
      data: {
        name,
        mobile,
        type,
        workerType: workerType || null,
        salaryPerMonth: parseFloat(salaryPerMonth),
        address: address || null
      },
      include: { attendance: true }
    })
    res.json({ ...worker, daysPresent: 0, daysAbsent: 0, salaryThisMonth: 0 })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const updateWorker = async (req, res) => {
  try {
    const { id } = req.params
    const { name, mobile, workerType, salaryPerMonth, address } = req.body
    const worker = await prisma.worker.update({
      where: { id: parseInt(id) },
      data: {
        name,
        mobile,
        workerType: workerType || null,
        salaryPerMonth: parseFloat(salaryPerMonth),
        address: address || null
      },
      include: { attendance: true }
    })

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const totalDays = monthEnd.getDate()
    const thisMonthAttendance = worker.attendance.filter(a => {
      const d = new Date(a.date)
      return d >= monthStart && d <= monthEnd
    })
    const daysPresent = thisMonthAttendance.filter(a => a.status === 'present').length
    const daysAbsent = thisMonthAttendance.filter(a => a.status === 'absent').length
    const salaryThisMonth = Math.round((daysPresent / totalDays) * worker.salaryPerMonth)

    res.json({ ...worker, daysPresent, daysAbsent, salaryThisMonth })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const deleteWorker = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.attendance.deleteMany({ where: { workerId: parseInt(id) } })
    await prisma.worker.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Worker deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const getAttendance = async (req, res) => {
  try {
    const { id } = req.params
    const { year, month } = req.query

    const y = parseInt(year) || new Date().getFullYear()
    const m = parseInt(month) || new Date().getMonth() + 1

    const monthStart = new Date(y, m - 1, 1)
    const monthEnd = new Date(y, m, 0, 23, 59, 59)

    const attendance = await prisma.attendance.findMany({
      where: {
        workerId: parseInt(id),
        date: { gte: monthStart, lte: monthEnd }
      }
    })

    res.json(attendance)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const saveAttendance = async (req, res) => {
  try {
    const { id } = req.params
    const { attendance, year, month } = req.body

    const y = parseInt(year)
    const m = parseInt(month)

    const monthStart = new Date(y, m - 1, 1)
    const monthEnd = new Date(y, m, 0, 23, 59, 59)

    // Delete existing attendance for this month
    await prisma.attendance.deleteMany({
      where: {
        workerId: parseInt(id),
        date: { gte: monthStart, lte: monthEnd }
      }
    })

    // Create new attendance records
    if (attendance && attendance.length > 0) {
      await prisma.attendance.createMany({
        data: attendance.map(a => ({
          workerId: parseInt(id),
          date: new Date(a.date),
          status: a.status
        }))
      })
    }

    res.json({ message: 'Attendance saved' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getWorkers, createWorker, updateWorker, deleteWorker, getAttendance, saveAttendance }