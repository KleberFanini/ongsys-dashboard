import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/src/lib/db'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const search = searchParams.get('search') || ''
        const categoria = searchParams.get('categoria') || 'Todos'
        const status = searchParams.get('status') || 'Todos'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = 20
        const offset = (page - 1) * limit

        let whereClause = '1=1'
        const values: any[] = []

        // Filtro de busca
        if (search) {
            whereClause += ` AND (LOWER(nomeProduto) LIKE LOWER($${values.length + 1})
                OR LOWER(codigo) LIKE LOWER($${values.length + 1}))`
            values.push(`%${search}%`)
        }

        // Filtro por categoria
        if (categoria !== 'Todos') {
            whereClause += ` AND LOWER(grupo) = LOWER($${values.length + 1})`
            values.push(categoria)
        }

        // Filtro por status
        if (status !== 'Todos') {
            whereClause += ` AND LOWER(status) = LOWER($${values.length + 1})`
            values.push(status)
        }

        // Query principal - REMOVIDAS as colunas que não existem
        const dataQuery = `
            SELECT 
                id,
                codigo,
                nomeProduto as nome,
                grupo as categoria,
                unidadeMedida,
                status,
                descricaoProduto as descricao,
                origem,
                contaPadraoPlanoFinanceiro as "contaPadrao",
                fabricante,
                valorCustoBase as preco
            FROM produtos
            WHERE ${whereClause}
            ORDER BY CAST(codigo AS INTEGER)
            LIMIT $${values.length + 1} OFFSET $${values.length + 2}
        `

        const dataValues = [...values, limit, offset]
        const countQuery = `
            SELECT COUNT(*) as total
            FROM produtos
            WHERE ${whereClause}
        `

        console.log('📝 Query:', dataQuery)
        console.log('📝 Values:', dataValues)

        const [dataResult, countResult] = await Promise.all([
            query(dataQuery, dataValues),
            query(countQuery, values)
        ])

        const total = parseInt(countResult.rows[0].total)

        return NextResponse.json({
            data: dataResult.rows,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        })

    } catch (error) {
        console.error('❌ Erro ao buscar produtos:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}