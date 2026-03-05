// ongsys-dashboard/src/app/api/pedidos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/src/lib/db'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status') || 'todos'
        const tipo = searchParams.get('tipo') || 'todos'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = 20
        const offset = (page - 1) * limit

        let whereClause = '1=1'
        const values: any[] = []

        // Filtro de busca (título, fornecedor, ID do pedido)
        if (search) {
            whereClause += ` AND (
                LOWER(titulo) LIKE LOWER($${values.length + 1})
                OR LOWER(fornecedor_nome) LIKE LOWER($${values.length + 1})
                OR id_pedido LIKE $${values.length + 1}
            )`
            values.push(`%${search}%`)
        }

        // Filtro por status
        if (status !== 'todos') {
            whereClause += ` AND LOWER(status_pedido) = LOWER($${values.length + 1})`
            values.push(status)
        }

        // Filtro por tipo de pedido
        if (tipo !== 'todos') {
            whereClause += ` AND LOWER(tipo_pedido) = LOWER($${values.length + 1})`
            values.push(tipo)
        }

        // Query principal
        const dataQuery = `
            SELECT 
                id,
                id_pedido,
                titulo,
                status_pedido,
                fornecedor_nome,
                fornecedor_documento,
                requisitante,
                data_pedido,
                tipo_pedido,
                valor_total,
                local_entrega,
                itens_pedido
            FROM pedidos
            WHERE ${whereClause}
            ORDER BY data_pedido DESC
            LIMIT $${values.length + 1} OFFSET $${values.length + 2}
        `

        const dataValues = [...values, limit, offset]
        const countQuery = `
            SELECT COUNT(*) as total
            FROM pedidos
            WHERE ${whereClause}
        `

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
        console.error('❌ Erro ao buscar pedidos:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}