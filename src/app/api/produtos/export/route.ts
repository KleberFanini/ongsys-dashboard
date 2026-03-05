import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/src/lib/db'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const search = searchParams.get('search') || ''
        const categoria = searchParams.get('categoria') || 'Todos'
        const status = searchParams.get('status') || 'Todos'
        const tipo = searchParams.get('tipo') || 'filtro'
        const page = parseInt(searchParams.get('page') || '1')

        console.log('🚀 Exportação - Parâmetros:', { search, categoria, status, tipo, page })

        let whereClause = '1=1'
        const values: any[] = []

        // Aplicar filtros
        if (tipo !== 'tudo') {
            if (search) {
                whereClause += ` AND (LOWER(nomeProduto) LIKE LOWER($${values.length + 1})
                    OR LOWER(codigo) LIKE LOWER($${values.length + 1}))`
                values.push(`%${search}%`)
            }

            if (categoria !== 'Todos') {
                whereClause += ` AND LOWER(grupo) = LOWER($${values.length + 1})`
                values.push(categoria)
            }

            if (status !== 'Todos') {
                whereClause += ` AND LOWER(status) = LOWER($${values.length + 1})`
                values.push(status)
            }
        }

        // Query com APENAS as colunas que existem
        let dataQuery = `
            SELECT 
                id,
                codigo,
                nomeProduto,
                descricaoProduto,
                grupo as categoria,
                unidadeMedida,
                status,
                fabricante,
                origem,
                contaPadraoPlanoFinanceiro as contaPadrao,
                valorCustoBase as valorCusto,
                imported_at as dataImportacao
            FROM produtos
            WHERE ${whereClause}
            ORDER BY CAST(codigo AS INTEGER)
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

        // Cabeçalho do CSV
        const headers = [
            'ID',
            'Código',
            'Nome do Produto',
            'Descrição',
            'Categoria',
            'Unidade de Medida',
            'Status',
            'Fabricante',
            'Origem',
            'Conta Padrão',
            'Valor de Custo',
            'Data de Importação'
        ]

        // Gerar CSV
        const csvRows = []
        csvRows.push(headers.join(';'))

        // Dados
        for (const produto of result.rows) {
            const row = [
                produto.id,
                produto.codigo || '',
                `"${(produto.nomeproduto || '').replace(/"/g, '""')}"`,
                `"${(produto.descricaoproduto || '').replace(/"/g, '""')}"`,
                produto.categoria || '',
                produto.unidademedida || '',
                produto.status || '',
                produto.fabricante || '',
                produto.origem || '',
                `"${(produto.contapadrao || '').replace(/"/g, '""')}"`,
                produto.valorcusto ? produto.valorcusto.toString().replace('.', ',') : '0,00',
                produto.dataimportacao ? new Date(produto.dataimportacao).toLocaleDateString('pt-BR') : ''
            ]
            csvRows.push(row.join(';'))
        }

        const csv = csvRows.join('\n')

        // Nome do arquivo
        const dataAtual = new Date().toISOString().split('T')[0]
        const filtros = []
        if (search) filtros.push('busca')
        if (categoria !== 'Todos') filtros.push(categoria.toLowerCase())
        if (status !== 'Todos') filtros.push(status.toLowerCase())

        const nomeFiltros = filtros.length > 0 ? `_${filtros.join('_')}` : ''
        const nomeArquivo = `produtos_${dataAtual}${nomeFiltros}_${tipo}.csv`

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