const prisma = require('../prismaClient')

// Get all godown materials
const getMaterials = async (req, res) => {
  try {
    const { search } = req.query
    const where = search ? {
      name: { contains: search, mode: 'insensitive' }
    } : {}

    const materials = await prisma.godownMaterial.findMany({
      where,
      include: {
        usageHistory: {
          orderBy: { date: 'desc' }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Calculate today's usage for each material
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const materialsWithStats = materials.map(material => {
      const todayUsed = material.usageHistory
        .filter(u => new Date(u.date) >= today)
        .reduce((sum, u) => sum + u.quantity, 0)

      const totalUsed = material.usageHistory
        .reduce((sum, u) => sum + u.quantity, 0)

      return {
        ...material,
        todayUsed,
        totalUsed
      }
    })

    res.json(materialsWithStats)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Add new material or add stock to existing
const addMaterial = async (req, res) => {
  try {
    const { name, availableQuantity, unit } = req.body

    if (!name || availableQuantity === undefined || !unit) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    // Check if material already exists
    const existing = await prisma.godownMaterial.findUnique({
      where: { name }
    })

    let material
    if (existing) {
      // Add to existing stock
      material = await prisma.godownMaterial.update({
        where: { name },
        data: {
          availableQuantity: existing.availableQuantity + parseFloat(availableQuantity)
        },
        include: { usageHistory: { orderBy: { date: 'desc' } } }
      })
    } else {
      // Create new material
      material = await prisma.godownMaterial.create({
        data: {
          name,
          availableQuantity: parseFloat(availableQuantity),
          unit
        },
        include: { usageHistory: { orderBy: { date: 'desc' } } }
      })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayUsed = material.usageHistory
      .filter(u => new Date(u.date) >= today)
      .reduce((sum, u) => sum + u.quantity, 0)
    const totalUsed = material.usageHistory
      .reduce((sum, u) => sum + u.quantity, 0)

    res.json({ ...material, todayUsed, totalUsed, isExisting: !!existing })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Update material
const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params
    const { name, availableQuantity, unit } = req.body

    const material = await prisma.godownMaterial.update({
      where: { id: parseInt(id) },
      data: {
        name,
        availableQuantity: parseFloat(availableQuantity),
        unit
      },
      include: { usageHistory: { orderBy: { date: 'desc' } } }
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayUsed = material.usageHistory
      .filter(u => new Date(u.date) >= today)
      .reduce((sum, u) => sum + u.quantity, 0)
    const totalUsed = material.usageHistory
      .reduce((sum, u) => sum + u.quantity, 0)

    res.json({ ...material, todayUsed, totalUsed })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Delete material
const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.usageHistory.deleteMany({
      where: { materialId: parseInt(id) }
    })
    await prisma.godownMaterial.delete({
      where: { id: parseInt(id) }
    })
    res.json({ message: 'Material deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Add usage entry
const addUsage = async (req, res) => {
  try {
    const { id } = req.params
    const { quantity } = req.body

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Valid quantity required' })
    }

    const material = await prisma.godownMaterial.findUnique({
      where: { id: parseInt(id) }
    })

    if (!material) {
      return res.status(404).json({ message: 'Material not found' })
    }

    if (material.availableQuantity < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' })
    }

    // Add usage history entry
    await prisma.usageHistory.create({
      data: {
        materialId: parseInt(id),
        quantity: parseFloat(quantity),
        date: new Date()
      }
    })

    // Reduce available quantity
    const updated = await prisma.godownMaterial.update({
      where: { id: parseInt(id) },
      data: {
        availableQuantity: material.availableQuantity - parseFloat(quantity)
      },
      include: { usageHistory: { orderBy: { date: 'desc' } } }
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayUsed = updated.usageHistory
      .filter(u => new Date(u.date) >= today)
      .reduce((sum, u) => sum + u.quantity, 0)
    const totalUsed = updated.usageHistory
      .reduce((sum, u) => sum + u.quantity, 0)

    res.json({ ...updated, todayUsed, totalUsed })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get usage history for a material
const getUsageHistory = async (req, res) => {
  try {
    const { id } = req.params

    const material = await prisma.godownMaterial.findUnique({
      where: { id: parseInt(id) },
      include: {
        usageHistory: { orderBy: { date: 'desc' } }
      }
    })

    if (!material) {
      return res.status(404).json({ message: 'Material not found' })
    }

    res.json(material)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get material names for autocomplete
const getMaterialNames = async (req, res) => {
  try {
    const materials = await prisma.godownMaterial.findMany({
      select: { name: true },
      orderBy: { name: 'asc' }
    })
    res.json(materials.map(m => m.name))
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  getMaterials, addMaterial, updateMaterial,
  deleteMaterial, addUsage, getUsageHistory, getMaterialNames
}