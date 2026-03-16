const express = require('express')
const router = express.Router()
const { getSalesReport, getInventoryReport, getGodownReport, getPurchaseReport } = require('../controllers/reportController')

router.get('/sales', getSalesReport)
router.get('/inventory', getInventoryReport)
router.get('/godown', getGodownReport)
router.get('/purchase', getPurchaseReport)

module.exports = router