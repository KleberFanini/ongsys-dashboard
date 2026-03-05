// ongsys-dashboard/src/app/api/produtos/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/src/lib/db'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const search = searchParams.get('search') || ''
        const categoria = searchParams.get('categoria') || 'Todos'
        const tipo = searchParams.get('tipo') || 'filtro'
        const page = parseInt(searchParams.get('page') || '1')

        console.log('🚀 Exportação - Parâmetros:', { search, categoria, tipo, page })

        let whereClause = '1=1'
        const values: any[] = []

        // Aplicar filtros
        if (tipo !== 'tudo') {
            if (search) {
                whereClause += ` AND (LOWER(nomeProduto) LIKE $${values.length + 1} 
                    OR LOWER(codigo) LIKE $${values.length + 1})`
                values.push(`%${search.toLowerCase()}%`)
            }

            if (categoria !== 'Todos') {
                whereClause += ` AND LOWER(grupo) = LOWER($${values.length + 1})`
                values.push(categoria)
            }
        }

        // Query base
        let dataQuery = `
            SELECT 
                id,
                codigo,
                nomeProduto,
                grupo as categoria,
                valorCustoBase as preco,
                status,
                descricaoProduto,
                fabricante,
                unidadeMedida,
                origem,
                contaPadraoPlanoFinanceiro
            FROM produtos
            WHERE ${whereClause}
            ORDER BY nomeProduto
        `

        // Se for por página, adicionar LIMIT
        if (tipo === 'pagina') {
            const limit = 20
            const offset = (page - 1) * limit
            dataQuery += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`
            values.push(limit, offset)
        }

        console.log('📝 Query:', dataQuery)
        console.log('📝 Values:', values)

        const result = await query(dataQuery, values)
        console.log('📦 Registros encontrados:', result.rows.length)

        // Gerar CSV
        const csvRows = []

        // Cabeçalho
        csvRows.push([
            'ID',
            'Código',
            'Nome do Produto',
            'Categoria',
            'Preço',
            'Status',
            'Descrição',
            'Fabricante',
            'Unidade de Medida',
            'Origem',
            'Conta Padrão'
        ].join(';'))

        // Dados
        for (const produto of result.rows) {
            csvRows.push([
                produto.id,
                produto.codigo || '',
                `"${produto.nomeproduto || ''}"`,
                produto.categoria || '',
                produto.preco ? produto.preco.toString().replace('.', ',') : '0,00',
                produto.status || '',
                `"${produto.descricaoproduto || ''}"`,
                produto.fabricante || '',
                produto.unidademedida || '',
                produto.origem || '',
                `"${produto.contapadraoplanoFinanceiro || ''}"`
            ].join(';'))
        }

        const csv = csvRows.join('\n')

        // Nome do arquivo
        const dataAtual = new Date().toISOString().split('T')[0]
        const nomeArquivo = `produtos_${dataAtual}_${tipo}.csv`

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${nomeArquivo}"`
            }
        })

    } catch (error) {
        console.error('❌ Erro na exportação:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor', details: String(error) },
            { status: 500 }
        )
    }
}