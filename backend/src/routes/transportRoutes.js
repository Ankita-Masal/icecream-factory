const express = require('express')
const router = express.Router()
const {
  getTransports, createTransport, updateTransport, deleteTransport, cycleStatus,
  getVehicles, createVehicle, updateVehicle, deleteVehicle,
  getDrivers, createDriver, updateDriver, deleteDriver,
  getRecentBills
} = require('../controllers/transportController')

// Transport
router.get('/', getTransports)
router.post('/', createTransport)
router.put('/:id', updateTransport)
router.delete('/:id', deleteTransport)
router.patch('/:id/cycle-status', cycleStatus)

// Vehicles
router.get('/vehicles', getVehicles)
router.post('/vehicles', createVehicle)
router.put('/vehicles/:id', updateVehicle)
router.delete('/vehicles/:id', deleteVehicle)

// Drivers
router.get('/drivers', getDrivers)
router.post('/drivers', createDriver)
router.put('/drivers/:id', updateDriver)
router.delete('/drivers/:id', deleteDriver)

// Recent bills for transport
router.get('/recent-bills', getRecentBills)

module.exports = router