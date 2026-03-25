import { NextResponse } from 'next/server'
import { pedidosService } from '@/src/lib/api/services'

export async function GET() {
    try {
        const pedidos = await pedidosService.listar({}, 1)

        // Pegar o primeiro pedido para ver estrutura
        const primeiroPedido = pedidos.data?.[0]

        return NextResponse.json({
            total: pedidos.totalItems,
            estrutura: {
                campos: Object.keys(primeiroPedido || {}),
                exemplo: primeiroPedido
            }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}