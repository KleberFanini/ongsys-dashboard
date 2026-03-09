import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/src/lib/db'
import { identificarEtapaAtual, ETAPAS } from '@/src/lib/order-types'

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

        // Para cada pedido, identificar sua etapa atual
        const pedidosComEtapa = result.rows.map((pedido: any) => {
            let logs = pedido.logs
            if (typeof logs === 'string') {
                try {
                    logs = JSON.parse(logs)
                } catch {
                    logs = []
                }
            }

            const etapaAtual = identificarEtapaAtual(logs || [])

            return {
                ...pedido,
                etapaAtual
            }
        })

        // Filtrar por etapa se especificado
        const pedidosFiltrados = etapa === 'Todas'
            ? pedidosComEtapa
            : pedidosComEtapa.filter(p => p.etapaAtual === etapa)

        // Estatísticas por etapa (apenas etapa atual)
        const estatisticas = ETAPAS.map(etapaInfo => {
            const count = pedidosComEtapa.filter(p => p.etapaAtual === etapaInfo.nome).length
            return {
                nome: etapaInfo.nome,
                descricao: etapaInfo.descricao,
                quantidade: count,
                ordem: etapaInfo.ordem
            }
        }).sort((a, b) => a.ordem - b.ordem)

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