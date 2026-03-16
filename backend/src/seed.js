require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

const connectionString = process.env.DATABASE_URL
console.log('Connection string:', connectionString)

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  const hash = await bcrypt.hash('Maitri', 10)
  
  const user = await prisma.user.create({
    data: {
      username: 'Gaunesh',
      password: hash
    }
  })
  
  console.log('User created:', user.username)
  await prisma.$disconnect()
}

main()