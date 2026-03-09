import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/src/lib/db'
import { identificarEtapa, ETAPAS } from '@/src/lib/order-types'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const etapa = searchParams.get('etapa') || 'Todas'

        // Buscar todos os pedidos
        const result = await query(`
            SELECT 
                id,
                id_pedido,
                titulo,
                status_pedido,
                fornecedor_nome,
                data_pedido,
                tipo_pedido,
                valor_total,
                logs
            FROM pedidos
            ORDER BY data_pedido DESC
        `)

        // Filtrar pedidos que têm logs da etapa especificada
        const pedidosFiltrados = result.rows.filter((pedido: any) => {
            if (etapa === 'Todas') return true

            if (!pedido.logs) return false

            const logs = Array.isArray(pedido.logs)
                ? pedido.logs
                : JSON.parse(pedido.logs)

            return logs.some((log: any) => {
                const etapaLog = identificarEtapa(log)
                return etapaLog === etapa
            })
        })

        // Estatísticas por etapa
        const estatisticas = ETAPAS.map(etapa => {
            const count = result.rows.filter((pedido: any) => {
                if (!pedido.logs) return false
                const logs = Array.isArray(pedido.logs)
                    ? pedido.logs
                    : JSON.parse(pedido.logs)
                return logs.some((log: any) => identificarEtapa(log) === etapa.nome)
            }).length

            return {
                nome: etapa.nome,
                descricao: etapa.descricao,
                quantidade: count
            }
        })

        return NextResponse.json({
            pedidos: pedidosFiltrados,
            total: pedidosFiltrados.length,
            estatisticas
        })

    } catch (error) {
        console.error('❌ Erro ao buscar pedidos por etapa:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}