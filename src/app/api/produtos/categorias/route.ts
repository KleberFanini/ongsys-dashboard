import { NextResponse } from 'next/server'
import { query } from '@/src/lib/db'

export async function GET() {
    try {
        // Buscar categorias
        const categoriasResult = await query(`
            SELECT DISTINCT grupo as categoria
            FROM produtos 
            WHERE grupo IS NOT NULL AND grupo != ''
            ORDER BY grupo
        `)

        // Buscar status disponíveis
        const statusResult = await query(`
            SELECT DISTINCT status
            FROM produtos 
            WHERE status IS NOT NULL AND status != ''
            ORDER BY status
        `)

        const categorias = categoriasResult.rows.map(row => row.categoria)
        const statusList = statusResult.rows.map(row => row.status)

        return NextResponse.json({
            categorias,
            statusList
        })
    } catch (error) {
        console.error('Erro ao buscar categorias:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}