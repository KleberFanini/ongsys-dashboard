// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Iniciando seed...')

    const senhaHash = await bcrypt.hash('admin123', 10)

    const admin = await prisma.usuario.upsert({
        where: { email: 'admin@ongsys.com.br' },
        update: {},
        create: {
            email: 'admin@ongsys.com.br',
            senha: senhaHash,
            nome: 'Administrador',
            role: 'SUPER_ADMIN',
            ativo: true,
        },
    })
    console.log('✅ SUPER_ADMIN:', admin.email)

    const operador = await prisma.usuario.upsert({
        where: { email: 'operador@ongsys.com.br' },
        update: {},
        create: {
            email: 'operador@ongsys.com.br',
            senha: senhaHash,
            nome: 'Operador Sede',
            role: 'OPERADOR_SEDE',
            ativo: true,
        },
    })
    console.log('✅ OPERADOR_SEDE:', operador.email)

    const consultor = await prisma.usuario.upsert({
        where: { email: 'consultor@ongsys.com.br' },
        update: {},
        create: {
            email: 'consultor@ongsys.com.br',
            senha: senhaHash,
            nome: 'Consultor Cliente',
            role: 'CONSULTOR',
            ativo: true,
        },
    })
    console.log('✅ CONSULTOR:', consultor.email)

    console.log('🎉 Seed concluído!')
}

main()
    .catch((e) => {
        console.error('❌ Erro no seed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })