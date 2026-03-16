const prisma = require('../prismaClient')

const VEHICLE_TYPES = ['4 Wheeler', 'Car', '2 Wheeler', 'Tempo', 'Mini Truck', 'Truck', 'Refrigerated Van']
const STATUS_CYCLE = ['Scheduled', 'In Transit', 'Delivered', 'Cancelled']

// ===== TRANSPORT =====
const getTransports = async (req, res) => {
  try {
    const transports = await prisma.transport.findMany({
      include: {
        vehicle: true,
        driver: true,
        sale: { include: { customer: true } },
        customer: true
      },
      orderBy: { transportDate: 'desc' }
    })
    res.json(transports)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const createTransport = async (req, res) => {
  try {
    const {
      saleId, customerId, customerName, vehicleType, vehicleNumber,
      vehicleId, driverId, driverName, fromLocation, toLocation,
      transportDate, quantity, status, billItems
    } = req.body

    if (!fromLocation || !toLocation || !transportDate) {
      return res.status(400).json({ message: 'From, To location and date are required' })
    }

    const transport = await prisma.transport.create({
      data: {
        saleId: saleId ? parseInt(saleId) : null,
        customerId: customerId ? parseInt(customerId) : null,
        customerName: customerName || null,
        vehicleType: vehicleType || null,
        vehicleNumber: vehicleNumber || null,
        vehicleId: vehicleId ? parseInt(vehicleId) : null,
        driverId: driverId ? parseInt(driverId) : null,
        driverName: driverName || null,
        fromLocation,
        toLocation,
        transportDate: new Date(transportDate),
        quantity: parseInt(quantity || 0),
        status: status || 'Scheduled',
        billItems: billItems || null
      },
      include: {
        vehicle: true,
        driver: true,
        sale: { include: { customer: true } },
        customer: true
      }
    })
    res.json(transport)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const updateTransport = async (req, res) => {
  try {
    const { id } = req.params
    const {
      saleId, customerId, customerName, vehicleType, vehicleNumber,
      vehicleId, driverId, driverName, fromLocation, toLocation,
      transportDate, quantity, status, billItems
    } = req.body

    const transport = await prisma.transport.update({
      where: { id: parseInt(id) },
      data: {
        saleId: saleId ? parseInt(saleId) : null,
        customerId: customerId ? parseInt(customerId) : null,
        customerName: customerName || null,
        vehicleType: vehicleType || null,
        vehicleNumber: vehicleNumber || null,
        vehicleId: vehicleId ? parseInt(vehicleId) : null,
        driverId: driverId ? parseInt(driverId) : null,
        driverName: driverName || null,
        fromLocation,
        toLocation,
        transportDate: new Date(transportDate),
        quantity: parseInt(quantity || 0),
        status: status || 'Scheduled',
        billItems: billItems || null
      },
      include: {
        vehicle: true,
        driver: true,
        sale: { include: { customer: true } },
        customer: true
      }
    })
    res.json(transport)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const deleteTransport = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.transport.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const cycleStatus = async (req, res) => {
  try {
    const { id } = req.params
    const transport = await prisma.transport.findUnique({ where: { id: parseInt(id) } })
    const currentIdx = STATUS_CYCLE.indexOf(transport.status)
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length]
    const updated = await prisma.transport.update({
      where: { id: parseInt(id) },
      data: { status: nextStatus },
      include: {
        vehicle: true,
        driver: true,
        sale: { include: { customer: true } },
        customer: true
      }
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// ===== VEHICLES =====
const getVehicles = async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({ orderBy: { vehicleNumber: 'asc' } })
    res.json(vehicles)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const createVehicle = async (req, res) => {
  try {
    const { vehicleNumber, vehicleType, ownerName, ownerPhone, ownerEmail, ownerAddress } = req.body
    if (!vehicleNumber || !vehicleType || !ownerName || !ownerPhone || !ownerAddress) {
      return res.status(400).json({ message: 'All fields except email are required' })
    }
    const vehicle = await prisma.vehicle.create({
      data: { vehicleNumber, vehicleType, ownerName, ownerPhone, ownerEmail: ownerEmail || null, ownerAddress }
    })
    res.json(vehicle)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params
    const { vehicleNumber, vehicleType, ownerName, ownerPhone, ownerEmail, ownerAddress } = req.body
    const vehicle = await prisma.vehicle.update({
      where: { id: parseInt(id) },
      data: { vehicleNumber, vehicleType, ownerName, ownerPhone, ownerEmail: ownerEmail || null, ownerAddress }
    })
    res.json(vehicle)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.vehicle.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// ===== DRIVERS =====
const getDrivers = async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany({ orderBy: { name: 'asc' } })
    res.json(drivers)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const createDriver = async (req, res) => {
  try {
    const { name, phone, email, address, licenseNumber } = req.body
    if (!name || !phone || !address) {
      return res.status(400).json({ message: 'Name, phone and address are required' })
    }
    const driver = await prisma.driver.create({
      data: { name, phone, email: email || null, address, licenseNumber: licenseNumber || null }
    })
    res.json(driver)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const updateDriver = async (req, res) => {
  try {
    const { id } = req.params
    const { name, phone, email, address, licenseNumber } = req.body
    const driver = await prisma.driver.update({
      where: { id: parseInt(id) },
      data: { name, phone, email: email || null, address, licenseNumber: licenseNumber || null }
    })
    res.json(driver)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.driver.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const getRecentBills = async (req, res) => {
  try {
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    const bills = await prisma.sale.findMany({
      where: { billDate: { gte: twoDaysAgo } },
      include: {
        customer: true,
        items: { include: { product: { include: { category: true } } } }
      },
      orderBy: { billDate: 'desc' }
    })
    res.json(bills)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  getTransports, createTransport, updateTransport, deleteTransport, cycleStatus,
  getVehicles, createVehicle, updateVehicle, deleteVehicle,
  getDrivers, createDriver, updateDriver, deleteDriver,
  getRecentBills
}