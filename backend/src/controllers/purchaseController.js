const prisma = require('../prismaClient')

// ===== PURCHASE MATERIAL =====
const getPurchases = async (req, res) => {
  try {
    const purchases = await prisma.purchaseMaterial.findMany({
      orderBy: [{ supplier: 'asc' }, { purchaseDate: 'desc' }]
    })
    const grouped = {}
    purchases.forEach(p => {
      const key = p.supplier.toLowerCase().trim()
      if (!grouped[key]) grouped[key] = { supplier: p.supplier, items: [] }
      grouped[key].items.push(p)
    })
    const result = Object.values(grouped).map(({ supplier, items }) => ({
        supplier,
        dueAmount: items
            .filter(i => i.paymentStatus === 'Pending' || i.paymentStatus === 'Partial')
            .reduce((sum, i) => {
            const total = i.quantity * i.pricePerUnit
            const paid = i.paidAmount || 0
            return sum + (total - paid)
            }, 0),
        items
    }))
    res.json(result)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const createPurchase = async (req, res) => {
  try {
    const { name, supplier, quantity, unit, pricePerUnit, purchaseDate, paymentStatus, paymentDate, paidAmount } = req.body
    if (!name || !supplier || !quantity || !unit || !pricePerUnit || !purchaseDate) {
      return res.status(400).json({ message: 'All required fields must be filled' })
    }
    const totalAmount = parseFloat(quantity) * parseFloat(pricePerUnit)
    const paid = paidAmount ? parseFloat(paidAmount) : (paymentStatus === 'Paid' ? totalAmount : 0)
    let status = paymentStatus || 'Pending'
    if (paid > 0 && paid < totalAmount) status = 'Partial'
    if (paid >= totalAmount) status = 'Paid'

    const purchase = await prisma.purchaseMaterial.create({
      data: {
        name, supplier,
        quantity: parseFloat(quantity),
        unit,
        pricePerUnit: parseFloat(pricePerUnit),
        purchaseDate: new Date(purchaseDate),
        paymentStatus: status,
        paymentDate: (status === 'Paid' || status === 'Partial') && paymentDate ? new Date(paymentDate) : null,
        paidAmount: paid || null
      }
    })
    res.json(purchase)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const updatePurchase = async (req, res) => {
  try {
    const { id } = req.params
    const { name, supplier, quantity, unit, pricePerUnit, purchaseDate, paymentStatus, paymentDate, paidAmount } = req.body
    const purchase = await prisma.purchaseMaterial.update({
      where: { id: parseInt(id) },
      data: {
        name, supplier,
        quantity: parseFloat(quantity),
        unit,
        pricePerUnit: parseFloat(pricePerUnit),
        purchaseDate: new Date(purchaseDate),
        paymentStatus,
        paymentDate: paymentStatus !== 'Pending' && paymentDate ? new Date(paymentDate) : null,
        paidAmount: paidAmount ? parseFloat(paidAmount) : null
      }
    })
    res.json(purchase)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.purchaseMaterial.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const markPurchasePaid = async (req, res) => {
  try {
    const { id } = req.params
    const { paymentDate, paidAmount } = req.body
    const existing = await prisma.purchaseMaterial.findUnique({ where: { id: parseInt(id) } })
    const totalAmount = existing.quantity * existing.pricePerUnit
    const alreadyPaid = existing.paidAmount || 0
    const newPayment = parseFloat(paidAmount || totalAmount)
    const totalPaid = alreadyPaid + newPayment
    let status = totalPaid >= totalAmount ? 'Paid' : 'Partial'
    const purchase = await prisma.purchaseMaterial.update({
      where: { id: parseInt(id) },
      data: {
        paymentStatus: status,
        paymentDate: new Date(paymentDate || new Date()),
        paidAmount: totalPaid
      }
    })
    res.json(purchase)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

// ===== MILK =====
const getMilk = async (req, res) => {
  try {
    const milk = await prisma.milkPurchase.findMany({
      orderBy: [{ supplier: 'asc' }, { purchaseDate: 'desc' }]
    })
    const grouped = {}
    milk.forEach(m => {
      const key = m.supplier.toLowerCase().trim()
      if (!grouped[key]) grouped[key] = { supplier: m.supplier, items: [] }
      grouped[key].items.push(m)
    })
    const result = Object.values(grouped).map(({ supplier, items }) => ({
        supplier,
        dueAmount: items
            .filter(i => i.paymentStatus === 'Pending' || i.paymentStatus === 'Partial')
            .reduce((sum, i) => {
            const total = i.quantity * i.pricePerUnit
            const paid = i.paidAmount || 0
            return sum + (total - paid)
            }, 0),
        items
    }))
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const createMilk = async (req, res) => {
  try {
    const { supplier, litres, snf, fat, pricePerLitre, purchaseDate, paymentStatus, paymentDate, paidAmount } = req.body
    if (!supplier || !litres || !pricePerLitre || !purchaseDate) {
      return res.status(400).json({ message: 'All required fields must be filled' })
    }
    const totalAmount = parseFloat(litres) * parseFloat(pricePerLitre)
    const paid = paidAmount ? parseFloat(paidAmount) : (paymentStatus === 'Paid' ? totalAmount : 0)
    let status = paymentStatus || 'Pending'
    if (paid > 0 && paid < totalAmount) status = 'Partial'
    if (paid >= totalAmount) status = 'Paid'
    const milk = await prisma.milkPurchase.create({
      data: {
        supplier,
        litres: parseFloat(litres),
        snf: parseFloat(snf || 0),
        fat: parseFloat(fat || 0),
        pricePerLitre: parseFloat(pricePerLitre),
        totalAmount,
        purchaseDate: new Date(purchaseDate),
        paymentStatus: status,
        paymentDate: (status !== 'Pending') && paymentDate ? new Date(paymentDate) : null,
        paidAmount: paid || null
      }
    })
    res.json(milk)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const updateMilk = async (req, res) => {
  try {
    const { id } = req.params
    const { supplier, litres, snf, fat, pricePerLitre, purchaseDate, paymentStatus, paymentDate, paidAmount } = req.body
    const milk = await prisma.milkPurchase.update({
      where: { id: parseInt(id) },
      data: {
        supplier,
        litres: parseFloat(litres),
        snf: parseFloat(snf || 0),
        fat: parseFloat(fat || 0),
        pricePerLitre: parseFloat(pricePerLitre),
        totalAmount: parseFloat(litres) * parseFloat(pricePerLitre),
        purchaseDate: new Date(purchaseDate),
        paymentStatus,
        paymentDate: paymentStatus !== 'Pending' && paymentDate ? new Date(paymentDate) : null,
        paidAmount: paidAmount ? parseFloat(paidAmount) : null
      }
    })
    res.json(milk)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const deleteMilk = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.milkPurchase.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const markMilkPaid = async (req, res) => {
  try {
    const { id } = req.params
    const { paymentDate, paidAmount } = req.body
    const existing = await prisma.milkPurchase.findUnique({ where: { id: parseInt(id) } })
    const alreadyPaid = existing.paidAmount || 0
    const newPayment = parseFloat(paidAmount || existing.totalAmount)
    const totalPaid = alreadyPaid + newPayment
    let status = totalPaid >= existing.totalAmount ? 'Paid' : 'Partial'
    const milk = await prisma.milkPurchase.update({
      where: { id: parseInt(id) },
      data: {
        paymentStatus: status,
        paymentDate: new Date(paymentDate || new Date()),
        paidAmount: totalPaid
      }
    })
    res.json(milk)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// ===== KHAWA =====
const getKhawa = async (req, res) => {
  try {
    const khawa = await prisma.khawaPurchase.findMany({
      orderBy: [{ supplier: 'asc' }, { purchaseDate: 'desc' }]
    })
    const grouped = {}
    khawa.forEach(k => {
      const key = k.supplier.toLowerCase().trim()
      if (!grouped[key]) grouped[key] = { supplier: k.supplier, items: [] }
      grouped[key].items.push(k)
    })
    const result = Object.values(grouped).map(({ supplier, items }) => ({
        supplier,
        dueAmount: items
            .filter(i => i.paymentStatus === 'Pending' || i.paymentStatus === 'Partial')
            .reduce((sum, i) => {
            const total = i.quantity * i.pricePerUnit
            const paid = i.paidAmount || 0
            return sum + (total - paid)
            }, 0),
        items
    }))
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const createKhawa = async (req, res) => {
  try {
    const { supplier, quantity, pricePerUnit, purchaseDate, paymentStatus, paymentDate, paidAmount } = req.body
    if (!supplier || !quantity || !pricePerUnit || !purchaseDate) {
      return res.status(400).json({ message: 'All required fields must be filled' })
    }
    const totalAmount = parseFloat(quantity) * parseFloat(pricePerUnit)
    const paid = paidAmount ? parseFloat(paidAmount) : (paymentStatus === 'Paid' ? totalAmount : 0)
    let status = paymentStatus || 'Pending'
    if (paid > 0 && paid < totalAmount) status = 'Partial'
    if (paid >= totalAmount) status = 'Paid'
    const khawa = await prisma.khawaPurchase.create({
      data: {
        supplier,
        quantity: parseFloat(quantity),
        pricePerUnit: parseFloat(pricePerUnit),
        totalAmount,
        purchaseDate: new Date(purchaseDate),
        paymentStatus: status,
        paymentDate: (status !== 'Pending') && paymentDate ? new Date(paymentDate) : null,
        paidAmount: paid || null
      }
    })
    res.json(khawa)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const updateKhawa = async (req, res) => {
  try {
    const { id } = req.params
    const { supplier, quantity, pricePerUnit, purchaseDate, paymentStatus, paymentDate, paidAmount } = req.body
    const khawa = await prisma.khawaPurchase.update({
      where: { id: parseInt(id) },
      data: {
        supplier,
        quantity: parseFloat(quantity),
        pricePerUnit: parseFloat(pricePerUnit),
        totalAmount: parseFloat(quantity) * parseFloat(pricePerUnit),
        purchaseDate: new Date(purchaseDate),
        paymentStatus,
        paymentDate: paymentStatus !== 'Pending' && paymentDate ? new Date(paymentDate) : null,
        paidAmount: paidAmount ? parseFloat(paidAmount) : null
      }
    })
    res.json(khawa)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const deleteKhawa = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.khawaPurchase.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const markKhawaPaid = async (req, res) => {
  try {
    const { id } = req.params
    const { paymentDate, paidAmount } = req.body
    const existing = await prisma.khawaPurchase.findUnique({ where: { id: parseInt(id) } })
    const alreadyPaid = existing.paidAmount || 0
    const newPayment = parseFloat(paidAmount || existing.totalAmount)
    const totalPaid = alreadyPaid + newPayment
    let status = totalPaid >= existing.totalAmount ? 'Paid' : 'Partial'
    const khawa = await prisma.khawaPurchase.update({
      where: { id: parseInt(id) },
      data: {
        paymentStatus: status,
        paymentDate: new Date(paymentDate || new Date()),
        paidAmount: totalPaid
      }
    })
    res.json(khawa)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  getPurchases, createPurchase, updatePurchase, deletePurchase, markPurchasePaid,
  getMilk, createMilk, updateMilk, deleteMilk, markMilkPaid,
  getKhawa, createKhawa, updateKhawa, deleteKhawa, markKhawaPaid
}