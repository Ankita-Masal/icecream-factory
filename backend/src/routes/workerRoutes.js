const express = require('express')
const router = express.Router()
const { getWorkers, createWorker, updateWorker, deleteWorker, getAttendance, saveAttendance } = require('../controllers/workerController')

router.get('/', getWorkers)
router.post('/', createWorker)
router.put('/:id', updateWorker)
router.delete('/:id', deleteWorker)
router.get('/:id/attendance', getAttendance)
router.post('/:id/attendance', saveAttendance)

module.exports = router