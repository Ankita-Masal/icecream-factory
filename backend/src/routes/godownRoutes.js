const express = require('express')
const router = express.Router()
const {
  getMaterials, addMaterial, updateMaterial,
  deleteMaterial, addUsage, getUsageHistory, getMaterialNames
} = require('../controllers/godownController')

router.get('/', getMaterials)
router.get('/names', getMaterialNames)
router.post('/', addMaterial)
router.put('/:id', updateMaterial)
router.delete('/:id', deleteMaterial)
router.post('/:id/usage', addUsage)
router.get('/:id/history', getUsageHistory)

module.exports = router