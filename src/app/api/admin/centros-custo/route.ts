// src/app/api/admin/centros-custo/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/lib/auth/auth'
import { pedidosService } from '@/src/lib/api/services'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        // Apenas SUPER_ADMIN e OPERADOR_SEDE podem acessar
        if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'OPERADOR_SEDE') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Buscar pedidos para extrair centros de custo únicos
        const pedidos = await pedidosService.listarTodos({})

        const centrosCustoSet = new Set<string>()

        pedidos.forEach((pedido: any) => {
            pedido.itensPedido?.forEach((item: any) => {
                if (item.centroCusto && item.centroCusto.trim()) {
                    centrosCustoSet.add(item.centroCusto)
                }
            })
        })

        const centrosCusto = Array.from(centrosCustoSet)
            .sort()
            .map(code => ({
                id: code,
                nome: code,
                descricao: `Centro de Custo ${code}`
            }))

        return NextResponse.json(centrosCusto)
    } catch (error) {
        console.error('Erro ao buscar centros de custo:', error)
        return NextResponse.json([], { status: 500 })
    }
}