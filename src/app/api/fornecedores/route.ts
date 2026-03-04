// ongsys-dashboard/src/app/api/fornecedores/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/src/lib/db'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const search = searchParams.get('search') || ''
        const type = searchParams.get('type') || 'all'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = 20
        const offset = (page - 1) * limit

        let whereClause = '1=1'
        const values: any[] = []

        // Filtro de busca (nome, código, documento)
        if (search) {
            whereClause += ` AND (LOWER(nome) LIKE $${values.length + 1} 
                OR LOWER(codigo) LIKE $${values.length + 1} 
                OR documento LIKE $${values.length + 1})`
            values.push(`%${search.toLowerCase()}%`)
        }

        // Filtro por tipo de pessoa
        if (type !== 'all') {
            whereClause += ` AND tipo_pessoa = $${values.length + 1}`
            values.push(type === 'PJ' ? 'J' : 'F')
        }

        // Query para dados paginados
        const dataQuery = `
            SELECT 
                id,
                codigo,
                nome,
                documento,
                tipo_pessoa,
                email,
                telefone,
                celular,
                endereco
            FROM fornecedores
            WHERE ${whereClause}
            ORDER BY nome
            LIMIT $${values.length + 1} OFFSET $${values.length + 2}
        `

        // Clona os valores para a query de dados (adiciona limit e offset)
        const dataValues = [...values, limit, offset]

        // Query para contagem total (sem limit e offset)
        const countQuery = `
            SELECT COUNT(*) as total
            FROM fornecedores
            WHERE ${whereClause}
        `

        console.log('📝 Query:', dataQuery)
        console.log('📝 Values:', dataValues)

        const [dataResult, countResult] = await Promise.all([
            query(dataQuery, dataValues),
            query(countQuery, values) // Usa apenas os valores dos filtros
        ])

        // Mapeia os dados para o formato esperado pelo frontend
        const suppliers = dataResult.rows.map((row: any) => {
            // Extrai cidade e estado do JSON de endereço
            let city = '', state = ''
            if (row.endereco) {
                try {
                    const endereco = typeof row.endereco === 'string'
                        ? JSON.parse(row.endereco)
                        : row.endereco
                    city = endereco.cidade || endereco.city || ''
                    state = endereco.estado || endereco.state || ''
                } catch (e) {
                    console.error('Erro ao parsear endereço:', e)
                }
            }

            return {
                id: row.id,
                code: row.codigo || '---',
                name: row.nome,
                document: row.documento || '---',
                personType: row.tipo_pessoa === 'J' ? 'PJ' : 'PF',
                email: row.email || '---',
                phone: row.telefone || row.celular || '---',
                city,
                state
            }
        })

        const total = parseInt(countResult.rows[0].total)

        return NextResponse.json({
            data: suppliers,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        })

    } catch (error) {
        console.error('Erro ao buscar fornecedores:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}