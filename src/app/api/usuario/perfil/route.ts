// src/app/api/usuario/perfil/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/lib/auth/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    try {
        const { nome, email, telefone, cargo, avatar } = await req.json()

        // 🔥 Preparar dados para atualização (apenas campos que existem no schema)
        const updateData: any = {
            nome,
            email,
        }

        // 🔥 Se você adicionar esses campos no schema.prisma, descomente:
        // if (telefone !== undefined) updateData.telefone = telefone
        // if (cargo !== undefined) updateData.cargo = cargo
        // if (avatar !== undefined) updateData.avatar = avatar

        const usuario = await prisma.usuario.update({
            where: { id: session.user.id },
            data: updateData
        })

        // 🔥 Retornar os dados atualizados no formato que o frontend espera
        return NextResponse.json({
            id: usuario.id,
            name: usuario.nome,  // ← Note: 'name' não 'nome'
            email: usuario.email,
            role: usuario.role,
            centrosCusto: usuario.centrosCusto
        })
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error)
        return NextResponse.json(
            { error: 'Erro ao atualizar perfil' },
            { status: 500 }
        )
    }
}