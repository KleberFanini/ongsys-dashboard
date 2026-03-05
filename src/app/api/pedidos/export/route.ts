import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/src/lib/db'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status') || 'todos'
        const tipo = searchParams.get('tipo') || 'todos'
        const exportTipo = searchParams.get('exportTipo') || 'filtro'
        const page = parseInt(searchParams.get('page') || '1')

        console.log('🚀 Exportação de Pedidos - Parâmetros:', { search, status, tipo, exportTipo, page })

        let whereClause = '1=1'
        const values: any[] = []

        // Aplicar filtros (se não for "todos")
        if (exportTipo !== 'tudo') {
            if (search) {
                whereClause += ` AND (
                    LOWER(titulo) LIKE LOWER($${values.length + 1})
                    OR LOWER(fornecedor_nome) LIKE LOWER($${values.length + 1})
                    OR id_pedido LIKE $${values.length + 1}
                )`
                values.push(`%${search}%`)
            }

            if (status !== 'todos') {
                whereClause += ` AND LOWER(status_pedido) = LOWER($${values.length + 1})`
                values.push(status)
            }

            if (tipo !== 'todos') {
                whereClause += ` AND LOWER(tipo_pedido) = LOWER($${values.length + 1})`
                values.push(tipo)
            }
        }

        // Query base com TODOS os campos
        let dataQuery = `
            SELECT 
                id,
                id_pedido,
                titulo,
                status_pedido,
                fornecedor_nome,
                fornecedor_documento,
                requisitante,
                comprador,
                demandante,
                data_pedido,
                numero_referencia,
                tipo_pedido,
                fonte_pagadora,
                conta_plano_financeiro,
                subprojeto,
                portal_transparencia,
                ttd,
                descricao_pedido,
                justificativa_compra,
                obrigacoes_contratada,
                condicoes_comerciais,
                contrato,
                valor_total,
                local_entrega,
                itens_pedido,
                logs,
                imported_at
            FROM pedidos
            WHERE ${whereClause}
            ORDER BY data_pedido DESC
        `

        // Se for por página, adicionar LIMIT
        if (exportTipo === 'pagina') {
            const limit = 20
            const offset = (page - 1) * limit
            dataQuery += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`
            values.push(limit, offset)
        }

        console.log('📝 Query:', dataQuery)
        console.log('📝 Values:', values)

        const result = await query(dataQuery, values)
        console.log('📦 Registros encontrados:', result.rows.length)

        // Cabeçalho do CSV
        const headers = [
            'ID',
            'ID do Pedido',
            'Título',
            'Status',
            'Fornecedor',
            'Documento Fornecedor',
            'Requisitante',
            'Comprador',
            'Demandante',
            'Data do Pedido',
            'Número Referência',
            'Tipo',
            'Fonte Pagadora',
            'Conta Plano Financeiro',
            'Subprojeto',
            'Portal Transparência',
            'TTD',
            'Valor Total',
            'Descrição',
            'Justificativa',
            'Obrigações Contratada',
            'Condições Comerciais',
            'Contrato',
            'Data Importação'
        ]

        // Gerar CSV
        const csvRows = []
        csvRows.push(headers.join(';'))

        // Dados
        for (const pedido of result.rows) {
            // Formatar data
            const dataPedido = pedido.data_pedido
                ? new Date(pedido.data_pedido).toLocaleDateString('pt-BR')
                : ''

            const dataImportacao = pedido.imported_at
                ? new Date(pedido.imported_at).toLocaleDateString('pt-BR')
                : ''

            // Contar itens
            const qtdItens = pedido.itens_pedido ? pedido.itens_pedido.length : 0

            const row = [
                pedido.id,
                pedido.id_pedido || '',
                `"${(pedido.titulo || '').replace(/"/g, '""')}"`,
                pedido.status_pedido || '',
                `"${(pedido.fornecedor_nome || '').replace(/"/g, '""')}"`,
                pedido.fornecedor_documento || '',
                `"${(pedido.requisitante || '').replace(/"/g, '""')}"`,
                `"${(pedido.comprador || '').replace(/"/g, '""')}"`,
                `"${(pedido.demandante || '').replace(/"/g, '""')}"`,
                dataPedido,
                pedido.numero_referencia || '',
                pedido.tipo_pedido || '',
                `"${(pedido.fonte_pagadora || '').replace(/"/g, '""')}"`,
                `"${(pedido.conta_plano_financeiro || '').replace(/"/g, '""')}"`,
                pedido.subprojeto || '',
                pedido.portal_transparencia || '',
                pedido.ttd || '',
                pedido.valor_total ? pedido.valor_total.toString().replace('.', ',') : '0,00',
                `"${(pedido.descricao_pedido || '').replace(/"/g, '""')}"`,
                `"${(pedido.justificativa_compra || '').replace(/"/g, '""')}"`,
                `"${(pedido.obrigacoes_contratada || '').replace(/"/g, '""')}"`,
                `"${(pedido.condicoes_comerciais || '').replace(/"/g, '""')}"`,
                pedido.contrato || '',
                dataImportacao
            ]
            csvRows.push(row.join(';'))

            // Adicionar linha em branco antes dos itens (se houver)
            if (qtdItens > 0) {
                csvRows.push('') // Linha em branco
                csvRows.push('ITENS DO PEDIDO:;' + '='.repeat(50))
                csvRows.push('Grupo;Serviço;Quantidade;Centro de Custo;Descrição')

                for (const item of pedido.itens_pedido || []) {
                    csvRows.push([
                        item.grupo || '',
                        `"${(item.nomeServico || '').replace(/"/g, '""')}"`,
                        item.quantidade || '1',
                        item.centroCusto || '',
                        `"${(item.descricao || '').replace(/"/g, '""')}"`
                    ].join(';'))
                }
                csvRows.push('') // Linha em branco
            }
        }

        const csv = csvRows.join('\n')

        // Nome do arquivo
        const dataAtual = new Date().toISOString().split('T')[0]
        const filtros = []
        if (search) filtros.push('busca')
        if (status !== 'todos') filtros.push(status.toLowerCase())
        if (tipo !== 'todos') filtros.push(tipo.toLowerCase())

        const nomeFiltros = filtros.length > 0 ? `_${filtros.join('_')}` : ''
        const nomeArquivo = `pedidos_${dataAtual}${nomeFiltros}_${exportTipo}.csv`

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${nomeArquivo}"`
            }
        })

    } catch (error) {
        console.error('❌ Erro na exportação de pedidos:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor', details: String(error) },
            { status: 500 }
        )
    }
}