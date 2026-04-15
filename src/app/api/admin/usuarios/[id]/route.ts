// src/app/api/admin/usuarios/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/lib/auth/auth'
import { prisma } from '@/src/lib/prisma'
import bcrypt from 'bcryptjs'

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(
    request: NextRequest,
    { params }: RouteContext
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)

        if (session?.user?.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { email, nome, role, centrosCusto, ativo, senha } = body

        const data: {
            email: string
            nome: string
            centrosCusto: string[]
            ativo: boolean
            senha?: string
        } = {
            email,
            nome,
            centrosCusto: centrosCusto || [],
            ativo,
        }

        if (senha && senha.trim() !== '') {
            data.senha = await bcrypt.hash(senha, 10)
        }

        const usuario = await prisma.usuario.update({
            where: { id },
            data,
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
        console.error('Erro ao atualizar usuário:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: RouteContext
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)

        if (session?.user?.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const adminCount = await prisma.usuario.count({
            where: { role: 'SUPER_ADMIN' }
        })

        const usuario = await prisma.usuario.findUnique({
            where: { id }
        })

        if (usuario?.role === 'SUPER_ADMIN' && adminCount <= 1) {
            return NextResponse.json(
                { error: 'Não é possível excluir o único administrador' },
                { status: 400 }
            )
        }

        await prisma.usuario.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erro ao excluir usuário:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}