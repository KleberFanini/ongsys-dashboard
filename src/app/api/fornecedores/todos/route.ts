import { NextResponse } from 'next/server'
import { fornecedoresService } from '@/src/lib/api/services'

export async function GET() {
    try {
        const data = await fornecedoresService.listarTodos({})
        return NextResponse.json({ data, total: data.length })
    } catch (error) {
        return NextResponse.json({ data: [], total: 0 }, { status: 500 })
    }
}