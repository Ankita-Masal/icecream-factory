const prisma = require('../prismaClient')

const getSalesReport = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query
    const where = {}
    if (fromDate || toDate) {
      where.billDate = {}
      if (fromDate) where.billDate.gte = new Date(fromDate)
      if (toDate) where.billDate.lte = new Date(new Date(toDate).setHours(23, 59, 59, 999))
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
        items: { include: { product: { include: { category: true } } } }
      },
      orderBy: { billDate: 'desc' }
    })

    const totalBills = sales.length
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0)
    const pendingPayments = sales.filter(s => s.paymentStatus !== 'Paid').reduce((sum, s) => sum + s.totalAmount, 0)
    const itemsSold = sales.reduce((sum, s) => sum + s.items.reduce((is, i) => is + i.quantity, 0), 0)
    const boxesUsed = sales.reduce((sum, s) => sum + s.items.reduce((ib, i) => ib + i.boxes, 0), 0)

    res.json({ totalBills, totalRevenue, pendingPayments, itemsSold, boxesUsed: Math.round(boxesUsed), sales })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const getInventoryReport = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: [{ category: { name: 'asc' } }, { flavor: 'asc' }]
    })

    const totalProducts = products.length
    const outOfStock = products.filter(p => p.quantity === 0).length
    const totalStockValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0)

    res.json({ totalProducts, outOfStock, totalStockValue, products })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const getGodownReport = async (req, res) => {
  try {
    const materials = await prisma.godownMaterial.findMany({
      include: { usageHistory: { orderBy: { date: 'desc' } } },
      orderBy: { name: 'asc' }
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const result = materials.map(m => {
      const todayUsed = m.usageHistory.filter(u => new Date(u.date) >= today).reduce((sum, u) => sum + u.quantity, 0)
      const totalUsed = m.usageHistory.reduce((sum, u) => sum + u.quantity, 0)
      return { ...m, todayUsed, totalUsed }
    })

    res.json({ totalMaterials: materials.length, materials: result })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const getPurchaseReport = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query
    const dateFilter = {}
    if (fromDate || toDate) {
      dateFilter.purchaseDate = {}
      if (fromDate) dateFilter.purchaseDate.gte = new Date(fromDate)
      if (toDate) dateFilter.purchaseDate.lte = new Date(new Date(toDate).setHours(23, 59, 59, 999))
    }
    const [purchases, milk, khawa] = await Promise.all([
      prisma.purchaseMaterial.findMany({ where: dateFilter, orderBy: [{ supplier: 'asc' }, { purchaseDate: 'desc' }] }),
      prisma.milkPurchase.findMany({ where: dateFilter, orderBy: [{ supplier: 'asc' }, { purchaseDate: 'desc' }] }),
      prisma.khawaPurchase.findMany({ where: dateFilter, orderBy: [{ supplier: 'asc' }, { purchaseDate: 'desc' }] })
    ])

    // Combine all purchases
    const allPurchases = [
      ...purchases.map(p => ({ ...p, type: 'material', totalAmount: p.quantity * p.pricePerUnit })),
      ...milk.map(m => ({ ...m, type: 'milk', name: 'Milk', unit: 'liters', quantity: m.litres, pricePerUnit: m.pricePerLitre })),
      ...khawa.map(k => ({ ...k, type: 'khawa', name: 'Khawa', unit: 'kg' }))
    ]

    // Group by supplier
    const grouped = {}
    allPurchases.forEach(p => {
      const key = p.supplier.toLowerCase().trim()
      if (!grouped[key]) grouped[key] = { supplier: p.supplier, items: [] }
      grouped[key].items.push(p)
    })

    const totalPurchases = allPurchases.length
    const totalAmount = allPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0)
    const totalPaid = allPurchases.filter(p => p.paymentStatus === 'Paid').reduce((sum, p) => sum + (p.totalAmount || 0), 0)
    const pendingPayments = totalAmount - totalPaid

    res.json({
      totalPurchases, totalAmount, totalPaid, pendingPayments,
      suppliers: Object.values(grouped)
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getSalesReport, getInventoryReport, getGodownReport, getPurchaseReport }