const prisma = require('../prismaClient')

const getDashboard = async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      totalProducts,
      todaySales,
      pendingSales,
      products,
      purchasePending,
      milkPending,
      khawaPending
    ] = await Promise.all([
      prisma.product.count(),
      prisma.sale.findMany({
        where: { billDate: { gte: today } },
        include: { items: { include: { product: { include: { category: true } } } } }
      }),
      prisma.sale.findMany({
        where: { paymentStatus: { in: ['Pending', 'Partial'] } }
      }),
      prisma.product.findMany({
        include: { category: true }
      }),
      prisma.purchaseMaterial.findMany({
        where: { paymentStatus: { in: ['Pending', 'Partial'] } }
      }),
      prisma.milkPurchase.findMany({
        where: { paymentStatus: { in: ['Pending', 'Partial'] } }
      }),
      prisma.khawaPurchase.findMany({
        where: { paymentStatus: { in: ['Pending', 'Partial'] } }
      })
    ])

    // Today's sales total
    const todaySalesTotal = todaySales.reduce((sum, s) => sum + s.totalAmount, 0)

    // Pending payments from sales
    const pendingPayments = pendingSales.reduce((sum, s) => {
      const paid = s.paidAmount || 0
      return sum + (s.totalAmount - paid)
    }, 0)

    // Pending purchase payments
    const purchasePendingTotal =
      purchasePending.reduce((sum, p) => sum + (p.quantity * p.pricePerUnit - (p.paidAmount || 0)), 0) +
      milkPending.reduce((sum, m) => sum + (m.totalAmount - (m.paidAmount || 0)), 0) +
      khawaPending.reduce((sum, k) => sum + (k.totalAmount - (k.paidAmount || 0)), 0)

    // Sales by category (from all sales items)
    const allSales = await prisma.sale.findMany({
      include: { items: { include: { product: { include: { category: true } } } } }
    })

    const categoryMap = {}
    allSales.forEach(sale => {
      sale.items.forEach(item => {
        const cat = item.product?.category?.name || 'Other'
        if (!categoryMap[cat]) categoryMap[cat] = 0
        categoryMap[cat] += item.quantity * item.price
      })
    })

    const salesByCategory = Object.entries(categoryMap).map(([name, value]) => ({ name, value }))

    // Inventory status (top 8 products by quantity)
    const inventoryStatus = products
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8)
      .map(p => ({
        name: `${p.flavor} ${p.size}`,
        quantity: p.quantity
      }))

    res.json({
      totalProducts,
      todaySalesTotal,
      pendingPayments,
      purchasePendingTotal,
      salesByCategory,
      inventoryStatus
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getDashboard }