import { NextResponse } from 'next/server'
import { produtosService } from '@/src/lib/api/services'

export async function GET() {
    try {
        const data = await produtosService.listar(1)
        return NextResponse.json({
            success: true,
            total: data.totalItems,
            amostra: data.data?.[0]
        })
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}