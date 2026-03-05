// ongsys-dashboard/src/app/api/pedidos/filtros/route.ts
import { NextResponse } from 'next/server'
import { query } from '@/src/lib/db'

export async function GET() {
    try {
        // Buscar status únicos
        const statusResult = await query(`
            SELECT DISTINCT status_pedido
            FROM pedidos
            WHERE status_pedido IS NOT NULL AND status_pedido != ''
            ORDER BY status_pedido
        `)

        // Buscar tipos únicos
        const tiposResult = await query(`
            SELECT DISTINCT tipo_pedido
            FROM pedidos
            WHERE tipo_pedido IS NOT NULL AND tipo_pedido != ''
            ORDER BY tipo_pedido
        `)

        return NextResponse.json({
            status: statusResult.rows.map(row => row.status_pedido),
            tipos: tiposResult.rows.map(row => row.tipo_pedido)
        })
    } catch (error) {
        console.error('Erro ao buscar filtros:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}