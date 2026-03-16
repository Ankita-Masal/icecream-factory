const prisma = require('../prismaClient')

const getCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: { sales: true },
      orderBy: { name: 'asc' }
    })

    const result = customers.map(c => ({
      ...c,
      totalBills: c.sales.length,
      pendingAmount: c.sales
        .filter(s => s.paymentStatus === 'Pending')
        .reduce((sum, s) => sum + s.totalAmount, 0)
    }))

    res.json(result)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body
    if (!name || !phone || !address) {
      return res.status(400).json({ message: 'Name, phone and address are required' })
    }
    const customer = await prisma.customer.create({
      data: { name, phone, email: email || null, address }
    })
    res.json({ ...customer, totalBills: 0, pendingAmount: 0 })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params
    const { name, phone, email, address } = req.body
    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: { name, phone, email: email || null, address },
      include: { sales: true }
    })
    res.json({
      ...customer,
      totalBills: customer.sales.length,
      pendingAmount: customer.sales
        .filter(s => s.paymentStatus === 'Pending')
        .reduce((sum, s) => sum + s.totalAmount, 0)
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.customer.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Customer deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const getCustomerHistory = async (req, res) => {
  try {
    const { id } = req.params
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
      include: {
        sales: {
          orderBy: { billDate: 'desc' }
        }
      }
    })
    if (!customer) return res.status(404).json({ message: 'Customer not found' })

    const totalPaid = customer.sales
      .filter(s => s.paymentStatus === 'Paid')
      .reduce((sum, s) => sum + s.totalAmount, 0)

    const totalPending = customer.sales
      .filter(s => s.paymentStatus === 'Pending')
      .reduce((sum, s) => sum + s.totalAmount, 0)

    res.json({
      ...customer,
      totalPaid,
      totalPending,
      totalBills: customer.sales.length
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomerHistory }