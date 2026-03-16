const express = require('express')
const router = express.Router()
const {
  getSales, createSale, updateSale, deleteSale,
  markSalePaid, finalizeBill, getBillVersions
} = require('../controllers/salesController')

router.get('/', getSales)
router.post('/', createSale)
router.put('/:id', updateSale)
router.delete('/:id', deleteSale)
router.patch('/:id/paid', markSalePaid)
router.patch('/:id/finalize', finalizeBill)
router.get('/:id/versions', getBillVersions)

module.exports = router