const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./src/routes/authRoutes')
const inventoryRoutes = require('./src/routes/inventoryRoutes')
const godownRoutes = require('./src/routes/godownRoutes')
const purchaseRoutes = require('./src/routes/purchaseRoutes')
const customerRoutes = require('./src/routes/customerRoutes')
const salesRoutes = require('./src/routes/salesRoutes')
const workerRoutes = require('./src/routes/workerRoutes')
const transportRoutes = require('./src/routes/transportRoutes')
const reportRoutes = require('./src/routes/reportRoutes')
const dashboardRoutes = require('./src/routes/dashboardRoutes')

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Ice Cream Factory API is running' })
})

// Routes will be added here
app.use('/api/auth', authRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/godown', godownRoutes)
app.use('/api/purchase', purchaseRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/sales', salesRoutes)
app.use('/api/workers', workerRoutes)
app.use('/api/transport', transportRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/dashboard', dashboardRoutes)

const PORT = process.env.PORT || 5000

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
})