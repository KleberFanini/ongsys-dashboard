import { NextRequest, NextResponse } from 'next/server'
import { getDashboardSummaryFromAPI } from '@/src/lib/dashboard-queries'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const costCenter = searchParams.get('costCenter')

        console.log('🔍 Dashboard API recebeu:', { startDate, endDate, costCenter })

        const filters: {
            startDate?: string;
            endDate?: string;
            costCenter?: string;
        } = {}

        if (startDate && startDate.trim() !== '') filters.startDate = startDate
        if (endDate && endDate.trim() !== '') filters.endDate = endDate
        if (costCenter && costCenter.trim() !== '' && costCenter !== 'todos') filters.costCenter = costCenter

        const data = await getDashboardSummaryFromAPI(filters)
        return NextResponse.json(data)
    } catch (error) {
        console.error('❌ Erro no dashboard:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}