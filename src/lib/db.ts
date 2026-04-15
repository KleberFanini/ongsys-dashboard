import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma

// Para compatibilidade com as rotas que usam 'query'
export const query = async (sql: string, params?: any[]) => {
    console.warn('query() não implementado - use prisma diretamente')
    return []
}