// src/app/api/contas-pagar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { contasPagarService } from '@/src/lib/api/services';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const startDate = searchParams.get('data_inicio') || undefined;
        const endDate = searchParams.get('data_fim') || undefined;

        const result = await contasPagarService.listar({ startDate, endDate }, page);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Erro ao buscar contas a pagar:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar contas a pagar' },
            { status: 500 }
        );
    }
}