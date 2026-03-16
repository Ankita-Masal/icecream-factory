const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../prismaClient')

const login = async (req, res) => {
  try {
    const { username, password } = req.body

    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' })
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid username or password' })
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ token, username: user.username })

  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const updateCredentials = async (req, res) => {
  try {
    const { currentPassword, newUsername, newPassword } = req.body

    const user = await prisma.user.findFirst()
    if (!user) return res.status(404).json({ message: 'User not found' })

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) return res.status(401).json({ message: 'Current password is incorrect' })

    const updateData = {}
    if (newUsername && newUsername.trim()) updateData.username = newUsername.trim()
    if (newPassword && newPassword.trim()) {
      updateData.password = await bcrypt.hash(newPassword.trim(), 10)
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No changes provided' })
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData
    })

    res.json({ message: 'Credentials updated successfully', username: updated.username })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { login, updateCredentials }