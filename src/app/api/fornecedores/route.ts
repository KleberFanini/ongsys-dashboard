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

        if (search) {
            whereClause += ` AND (LOWER(nomeEmpresa) LIKE $${values.length + 1} 
                OR LOWER(codigo) LIKE $${values.length + 1} 
                OR documento LIKE $${values.length + 1})`
            values.push(`%${search.toLowerCase()}%`)
        }

        if (type !== 'all') {
            whereClause += ` AND tipo_pessoa = $${values.length + 1}`
            values.push(type === 'PJ' ? 'J' : 'F')
        }

        const dataQuery = `
            SELECT 
                id,
                codigo,
                nomeEmpresa as nome,
                documento,
                tipo_pessoa,
                email,
                telefone,
                celular
            FROM fornecedores
            WHERE ${whereClause}
            ORDER BY nomeEmpresa
            LIMIT $${values.length + 1} OFFSET $${values.length + 2}
        `

        const dataValues = [...values, limit, offset]
        const countQuery = `
            SELECT COUNT(*) as total
            FROM fornecedores
            WHERE ${whereClause}
        `

        const [dataResult, countResult] = await Promise.all([
            query(dataQuery, dataValues),
            query(countQuery, values)
        ])

        // 🔍 LOG PARA VER A ESTRUTURA EXATA DO OBJETO
        if (dataResult.rows.length > 0) {
            console.log('🔍 CHAVES DISPONÍVEIS:', Object.keys(dataResult.rows[0]));
            console.log('🔍 VALORES:', dataResult.rows[0]);
        }

        // Mapeia os dados tentando todas as variações do nome
        const suppliers = dataResult.rows.map((row: any) => ({
            id: row.id,
            code: row.codigo || '---',
            // Tenta várias formas de pegar o nome
            name: row.nome || '---',
            document: row.documento || '---',
            personType: row.tipo_pessoa === 'J' ? 'PJ' : 'PF',
            email: row.email || '---',
            phone: row.telefone || row.celular || '---',
            city: '',
            state: ''
        }))

        const total = parseInt(countResult.rows[0].total)

        return NextResponse.json({
            data: suppliers,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        })

    } catch (error) {
        console.error('❌ Erro ao buscar fornecedores:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}