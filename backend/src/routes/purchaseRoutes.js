const express = require('express')
const router = express.Router()
const {
  getPurchases, createPurchase, updatePurchase, deletePurchase, markPurchasePaid,
  getMilk, createMilk, updateMilk, deleteMilk, markMilkPaid,
  getKhawa, createKhawa, updateKhawa, deleteKhawa, markKhawaPaid
} = require('../controllers/purchaseController')

// Purchase Material
router.get('/materials', getPurchases)
router.post('/materials', createPurchase)
router.put('/materials/:id', updatePurchase)
router.delete('/materials/:id', deletePurchase)
router.patch('/materials/:id/paid', markPurchasePaid)

// Milk
router.get('/milk', getMilk)
router.post('/milk', createMilk)
router.put('/milk/:id', updateMilk)
router.delete('/milk/:id', deleteMilk)
router.patch('/milk/:id/paid', markMilkPaid)

// Khawa
router.get('/khawa', getKhawa)
router.post('/khawa', createKhawa)
router.put('/khawa/:id', updateKhawa)
router.delete('/khawa/:id', deleteKhawa)
router.patch('/khawa/:id/paid', markKhawaPaid)

module.exports = router