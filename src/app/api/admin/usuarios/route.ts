import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/lib/auth/auth'
import { prisma } from '@/src/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (session?.user?.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const usuarios = await prisma.usuario.findMany({
            select: {
                id: true,
                email: true,
                nome: true,
                role: true,
                centrosCusto: true,
                ativo: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(usuarios)
    } catch (error) {
        console.error('Erro ao buscar usuários:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (session?.user?.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { email, senha, nome, role, centrosCusto } = body

        if (!email || !senha || !nome) {
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
        }

        const senhaHash = await bcrypt.hash(senha, 10)

        const usuario = await prisma.usuario.create({
            data: {
                email,
                senha: senhaHash,
                nome,
                role: role || 'CONSULTOR',
                centrosCusto: centrosCusto || [],
                ativo: true,
            },
            select: {
                id: true,
                email: true,
                nome: true,
                role: true,
                centrosCusto: true,
                ativo: true,
                createdAt: true,
            }
        })

        return NextResponse.json(usuario)
    } catch (error) {
        console.error('Erro ao criar usuário:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}