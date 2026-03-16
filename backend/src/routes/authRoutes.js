const express = require('express')
const router = express.Router()
const { login, updateCredentials } = require('../controllers/authController')

router.post('/login', login)
router.put('/credentials', updateCredentials)
module.exports = router