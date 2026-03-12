// ongsys-dashboard/src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getDashboardSummary } from '@/src/lib/dashboard-queries'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const costCenter = searchParams.get('costCenter')

        console.log('🔍 API recebeu:', { startDate, endDate, costCenter })

        // Criar objeto de filtros incluindo TODOS os parâmetros
        const filters: {
            startDate?: string;
            endDate?: string;
            costCenter?: string;
        } = {}

        // Adicionar apenas se existir e não for vazio
        if (startDate && startDate.trim() !== '') {
            filters.startDate = startDate
        }

        if (endDate && endDate.trim() !== '') {
            filters.endDate = endDate
        }

        if (costCenter && costCenter.trim() !== '' && costCenter !== 'todos') {
            filters.costCenter = costCenter
        }

        console.log('📦 Enviando filtros para getDashboardSummary:', filters)

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