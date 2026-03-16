const express = require('express')
const router = express.Router()
const {
  getCategories, createCategory,
  getProducts, createProduct, updateProduct, deleteProduct,
  getBoxes, createBox, updateBox, deleteBox
} = require('../controllers/inventoryController')

// Categories
router.get('/categories', getCategories)
router.post('/categories', createCategory)

// Products
router.get('/products', getProducts)
router.post('/products', createProduct)
router.put('/products/:id', updateProduct)
router.delete('/products/:id', deleteProduct)

// Boxes
router.get('/boxes', getBoxes)
router.post('/boxes', createBox)
router.put('/boxes/:id', updateBox)
router.delete('/boxes/:id', deleteBox)

module.exports = router