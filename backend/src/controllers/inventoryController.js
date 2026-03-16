const prisma = require('../prismaClient')

// ===== CATEGORIES =====
const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    })
    res.json(categories)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const createCategory = async (req, res) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ message: 'Name is required' })

    const existing = await prisma.category.findUnique({ where: { name } })
    if (existing) return res.status(400).json({ message: 'Category already exists' })

    const category = await prisma.category.create({ data: { name } })
    res.json(category)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// ===== PRODUCTS =====
const getProducts = async (req, res) => {
  try {
    const { categoryId, flavor } = req.query
    const where = {}
    if (categoryId) where.categoryId = parseInt(categoryId)
    if (flavor) where.flavor = { contains: flavor, mode: 'insensitive' }

    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { category: { name: 'asc' } }
    })
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const createProduct = async (req, res) => {
  try {
    const { categoryId, size, flavor, price, quantity } = req.body
    if (!categoryId || !size || !flavor || !price || quantity === undefined) {
      return res.status(400).json({ message: 'All fields are required' })
    }
    const product = await prisma.product.create({
      data: {
        categoryId: parseInt(categoryId),
        size,
        flavor,
        price: parseFloat(price),
        quantity: parseInt(quantity)
      },
      include: { category: true }
    })
    res.json(product)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params
    const { categoryId, size, flavor, price, quantity } = req.body
    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        categoryId: parseInt(categoryId),
        size,
        flavor,
        price: parseFloat(price),
        quantity: parseInt(quantity)
      },
      include: { category: true }
    })
    res.json(product)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.product.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Product deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// ===== BOXES =====
const getBoxes = async (req, res) => {
  try {
    const boxes = await prisma.box.findMany({
      include: { category: true },
      orderBy: { category: { name: 'asc' } }
    })
    res.json(boxes)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const createBox = async (req, res) => {
  try {
    const { categoryId, size, quantityPerBox } = req.body
    if (!categoryId || !size || !quantityPerBox) {
      return res.status(400).json({ message: 'All fields are required' })
    }
    const box = await prisma.box.create({
      data: {
        categoryId: parseInt(categoryId),
        size,
        quantityPerBox: parseInt(quantityPerBox)
      },
      include: { category: true }
    })
    res.json(box)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const updateBox = async (req, res) => {
  try {
    const { id } = req.params
    const { categoryId, size, quantityPerBox } = req.body
    const box = await prisma.box.update({
      where: { id: parseInt(id) },
      data: {
        categoryId: parseInt(categoryId),
        size,
        quantityPerBox: parseInt(quantityPerBox)
      },
      include: { category: true }
    })
    res.json(box)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const deleteBox = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.box.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Box deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  getCategories, createCategory,
  getProducts, createProduct, updateProduct, deleteProduct,
  getBoxes, createBox, updateBox, deleteBox
}