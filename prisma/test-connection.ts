// prisma/test-connection.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT NOW() as time`
    console.log('✅ Conexão OK:', result)
  } catch (error) {
    console.error('❌ Erro de conexão:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()