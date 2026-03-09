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

        // Filtro de busca
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

        // Filtro por tipo
        if (tipo !== 'todos') {
            whereClause += ` AND LOWER(tipo_pedido) = LOWER($${values.length + 1})`
            values.push(tipo)
        }

        // Query principal com logs
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
                itens_pedido,
                logs
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
        ]);

        // DEBUG DETALHADO
        console.log('='.repeat(50));
        console.log('🔍 DEBUG PEDIDOS API');
        console.log('='.repeat(50));
        console.log(`📊 Total de pedidos encontrados: ${dataResult.rows.length}`);

        if (dataResult.rows.length > 0) {
            const primeiro = dataResult.rows[0];
            console.log('\n📦 Primeiro pedido:');
            console.log('   ID:', primeiro.id_pedido);
            console.log('   Título:', primeiro.titulo);
            console.log('   Status:', primeiro.status_pedido);
            console.log('\n📋 Campo logs:');
            console.log('   Existe?', primeiro.logs ? 'SIM' : 'NÃO');
            console.log('   Tipo:', typeof primeiro.logs);
            console.log('   É array?', Array.isArray(primeiro.logs));
            console.log('   Conteúdo:', JSON.stringify(primeiro.logs, null, 2));

            // Se for string, tenta parsear
            if (typeof primeiro.logs === 'string') {
                try {
                    const parsed = JSON.parse(primeiro.logs);
                    console.log('\n📋 Logs parseados:');
                    console.log('   Tipo após parse:', typeof parsed);
                    console.log('   É array?', Array.isArray(parsed));
                    console.log('   Tamanho:', Array.isArray(parsed) ? parsed.length : 'n/a');
                    console.log('   Conteúdo:', JSON.stringify(parsed, null, 2));
                } catch (e) {
                    // CORREÇÃO: Verifica o tipo do erro
                    if (e instanceof Error) {
                        console.log('❌ Erro ao parsear logs:', e.message);
                    } else {
                        console.log('❌ Erro desconhecido ao parsear logs');
                    }
                }
            }
        }
        console.log('='.repeat(50));

        const total = parseInt(countResult.rows[0].total)

        return NextResponse.json({
            data: dataResult.rows,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        })

    } catch (error) {
        // CORREÇÃO: Verifica o tipo do erro aqui também
        console.error('❌ Erro ao buscar pedidos:', error instanceof Error ? error.message : String(error));
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}