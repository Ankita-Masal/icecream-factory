const prisma = require('../prismaClient')

// Generate bill number
const generateBillNumber = async () => {
  const count = await prisma.sale.count()
  const num = String(count + 1).padStart(3, '0')
  return `BILL-${num}`
}

// Get all sales
const getSales = async (req, res) => {
  try {
    const { fromDate, toDate, recent } = req.query

    let where = {}

    if (recent === 'true') {
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      where.billDate = { gte: threeDaysAgo }
    } else if (fromDate && toDate) {
      where.billDate = {
        gte: new Date(fromDate),
        lte: new Date(new Date(toDate).setHours(23, 59, 59, 999))
      }
    } else if (fromDate) {
      where.billDate = { gte: new Date(fromDate) }
    } else if (toDate) {
      where.billDate = { lte: new Date(new Date(toDate).setHours(23, 59, 59, 999)) }
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
        items: { include: { product: { include: { category: true } } } },
        versions: { orderBy: { editedAt: 'desc' } }
      },
      orderBy: { billDate: 'desc' }
    })

    res.json(sales)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Create sale
const createSale = async (req, res) => {
  try {
    const { customerId, billDate, items, paymentStatus, paidAmount, paymentDate, billType } = req.body

    if (!customerId || !billDate || !items || items.length === 0) {
      return res.status(400).json({ message: 'Customer, date and items are required' })
    }

    const billNumber = await generateBillNumber()

    // Calculate total
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Calculate boxes for each item
    const itemsWithBoxes = await Promise.all(items.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(item.productId) },
        include: { category: true }
      })
      const boxConfig = await prisma.box.findFirst({
        where: { categoryId: product.categoryId, size: product.size }
      })
      const boxes = boxConfig ? Math.ceil(item.quantity / boxConfig.quantityPerBox) : 0
      return { ...item, boxes }
    }))

    // Determine payment status
    let status = paymentStatus || 'Pending'
    if (paidAmount && parseFloat(paidAmount) >= totalAmount) status = 'Paid'
    else if (paidAmount && parseFloat(paidAmount) > 0) status = 'Partial'

    // Create sale with items
    const sale = await prisma.sale.create({
      data: {
        billNumber,
        customerId: parseInt(customerId),
        billDate: new Date(billDate),
        totalAmount,
        paymentStatus: status,
        paymentDate: status !== 'Pending' && paymentDate ? new Date(paymentDate) : null,
        paidAmount: paidAmount ? parseFloat(paidAmount) : null,
        billType: billType || 'Rough',
        items: {
          create: itemsWithBoxes.map(item => ({
            productId: parseInt(item.productId),
            quantity: parseInt(item.quantity),
            price: parseFloat(item.price),
            boxes: parseFloat(item.boxes || 0)
          }))
        }
      },
      include: {
        customer: true,
        items: { include: { product: { include: { category: true } } } },
        versions: true
      }
    })

    // Reduce inventory
    for (const item of items) {
      await prisma.product.update({
        where: { id: parseInt(item.productId) },
        data: { quantity: { decrement: parseInt(item.quantity) } }
      })
    }

    // Save initial version
    await prisma.billVersion.create({
      data: {
        saleId: sale.id,
        version: 1,
        items: sale.items,
        total: totalAmount,
        billType: billType || 'Rough',
        note: 'Initial bill created',
        editedAt: new Date()
      }
    })

    res.json(sale)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Update sale (only Rough bills)
const updateSale = async (req, res) => {
  try {
    const { id } = req.params
    const { customerId, billDate, items, paymentStatus, paidAmount, paymentDate, billType } = req.body

    const existing = await prisma.sale.findUnique({
      where: { id: parseInt(id) },
      include: { items: true, versions: true }
    })

    if (!existing) return res.status(404).json({ message: 'Bill not found' })
    if (existing.billType === 'Final') {
      return res.status(400).json({ message: 'Final bills cannot be edited' })
    }

    // Add back old inventory
    for (const oldItem of existing.items) {
      await prisma.product.update({
        where: { id: oldItem.productId },
        data: { quantity: { increment: oldItem.quantity } }
      })
    }

    // Calculate new total
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Calculate boxes
    const itemsWithBoxes = await Promise.all(items.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(item.productId) },
        include: { category: true }
      })
      const boxConfig = await prisma.box.findFirst({
        where: { categoryId: product.categoryId, size: product.size }
      })
      const boxes = boxConfig ? Math.ceil(item.quantity / boxConfig.quantityPerBox) : 0
      return { ...item, boxes }
    }))

    // Determine status
    let status = paymentStatus || 'Pending'
    if (paidAmount && parseFloat(paidAmount) >= totalAmount) status = 'Paid'
    else if (paidAmount && parseFloat(paidAmount) > 0) status = 'Partial'

    // Delete old items
    await prisma.saleItem.deleteMany({ where: { saleId: parseInt(id) } })

    // Update sale
    const sale = await prisma.sale.update({
      where: { id: parseInt(id) },
      data: {
        customerId: parseInt(customerId),
        billDate: new Date(billDate),
        totalAmount,
        paymentStatus: status,
        paymentDate: status !== 'Pending' && paymentDate ? new Date(paymentDate) : null,
        paidAmount: paidAmount ? parseFloat(paidAmount) : null,
        billType: billType || existing.billType,
        paymentStatus: paymentStatus || 'Pending',
        paymentDate: paymentStatus !== 'Pending' && paymentDate ? new Date(paymentDate) : null,
        paidAmount: paymentStatus === 'Pending' ? null : (paidAmount ? parseFloat(paidAmount) : null),
        items: {
          create: itemsWithBoxes.map(item => ({
            productId: parseInt(item.productId),
            quantity: parseInt(item.quantity),
            price: parseFloat(item.price),
            boxes: parseFloat(item.boxes || 0)
          }))
        }
      },
      include: {
        customer: true,
        items: { include: { product: { include: { category: true } } } },
        versions: { orderBy: { editedAt: 'desc' } }
      }
    })

    // Reduce new inventory
    for (const item of items) {
      await prisma.product.update({
        where: { id: parseInt(item.productId) },
        data: { quantity: { decrement: parseInt(item.quantity) } }
      })
    }

    // Save version
    const versionNumber = existing.versions.length + 1
    await prisma.billVersion.create({
      data: {
        saleId: parseInt(id),
        version: versionNumber,
        items: sale.items,
        total: totalAmount,
        billType: billType || existing.billType,
        note: `Edited - Version ${versionNumber}`,
        editedAt: new Date()
      }
    })

    res.json(sale)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Delete sale
const deleteSale = async (req, res) => {
  try {
    const { id } = req.params

    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(id) },
      include: { items: true }
    })

    if (!sale) return res.status(404).json({ message: 'Bill not found' })

    // Add back inventory
    for (const item of sale.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } }
      })
    }

    // Delete versions and items first
    await prisma.billVersion.deleteMany({ where: { saleId: parseInt(id) } })
    await prisma.saleItem.deleteMany({ where: { saleId: parseInt(id) } })
    await prisma.sale.delete({ where: { id: parseInt(id) } })

    res.json({ message: 'Bill deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Mark bill as paid
const markSalePaid = async (req, res) => {
  try {
    const { id } = req.params
    const { paymentDate, paidAmount } = req.body

    const existing = await prisma.sale.findUnique({ where: { id: parseInt(id) } })
    const alreadyPaid = existing.paidAmount || 0
    const newPayment = parseFloat(paidAmount || existing.totalAmount)
    const totalPaid = alreadyPaid + newPayment
    const status = totalPaid >= existing.totalAmount ? 'Paid' : 'Partial'

    const sale = await prisma.sale.update({
      where: { id: parseInt(id) },
      data: {
        paymentStatus: status,
        paymentDate: new Date(paymentDate || new Date()),
        paidAmount: totalPaid
      },
      include: {
        customer: true,
        items: { include: { product: { include: { category: true } } } },
        versions: { orderBy: { editedAt: 'desc' } }
      }
    })

    res.json(sale)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Finalize bill (Rough → Final)
const finalizeBill = async (req, res) => {
  try {
    const { id } = req.params

    const existing = await prisma.sale.findUnique({
      where: { id: parseInt(id) },
      include: { items: true, versions: true }
    })

    if (!existing) return res.status(404).json({ message: 'Bill not found' })
    if (existing.billType === 'Final') {
      return res.status(400).json({ message: 'Bill is already final' })
    }

    const sale = await prisma.sale.update({
      where: { id: parseInt(id) },
      data: { billType: 'Final' },
      include: {
        customer: true,
        items: { include: { product: { include: { category: true } } } },
        versions: { orderBy: { editedAt: 'desc' } }
      }
    })

    // Save final version
    await prisma.billVersion.create({
      data: {
        saleId: parseInt(id),
        version: existing.versions.length + 1,
        items: sale.items,
        total: sale.totalAmount,
        billType: 'Final',
        note: 'Bill finalized',
        editedAt: new Date()
      }
    })

    res.json(sale)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get bill versions
const getBillVersions = async (req, res) => {
  try {
    const { id } = req.params
    const versions = await prisma.billVersion.findMany({
      where: { saleId: parseInt(id) },
      orderBy: { editedAt: 'desc' }
    })
    res.json(versions)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  getSales, createSale, updateSale, deleteSale,
  markSalePaid, finalizeBill, getBillVersions
}