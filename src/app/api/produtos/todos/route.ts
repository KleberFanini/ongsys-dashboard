import { NextResponse } from 'next/server'
import { produtosService } from '@/src/lib/api/services'

export async function GET() {
    try {
        const data = await produtosService.listarTodos({})
        return NextResponse.json({ data, total: data.length })
    } catch (error) {
        return NextResponse.json({ data: [], total: 0 }, { status: 500 })
    }
}