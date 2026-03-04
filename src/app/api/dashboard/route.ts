import { NextResponse } from 'next/server'
import { getDashboardSummary } from '@/src/lib/dashboard-queries'

export async function GET() {
    try {
        const data = await getDashboardSummary()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Erro na API de dashboard:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}