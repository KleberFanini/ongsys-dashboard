// ongsys-dashboard/src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getDashboardSummary } from '@/src/lib/dashboard-queries'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // Criar objeto de filtros apenas com valores válidos
        const filters: { startDate?: string; endDate?: string } = {}

        // Só adicionar se existir e não for null
        if (startDate && startDate.trim() !== '') {
            filters.startDate = startDate
        }

        if (endDate && endDate.trim() !== '') {
            filters.endDate = endDate
        }

        const data = await getDashboardSummary(filters)
        return NextResponse.json(data)
    } catch (error) {
        console.error('Erro na API de dashboard:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}