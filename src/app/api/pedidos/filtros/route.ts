// src/app/api/pedidos/filtros/route.ts
import { NextResponse } from 'next/server';
import { pedidosService } from '@/src/lib/api/services';

export async function GET() {
    try {
        // Buscar apenas a primeira página para extrair filtros disponíveis (mais rápido)
        const primeiraPagina = await pedidosService.listar({}, 1);
        const pedidos = primeiraPagina.data || [];

        // Extrair status únicos
        const status = [...new Set(pedidos.map((p: any) => p.statusPedido).filter(Boolean))];

        // Extrair tipos de pedido únicos
        const tipos = [...new Set(pedidos.map((p: any) => p.tipoPedido).filter(Boolean))];

        return NextResponse.json({
            status,
            tipos
        });
    } catch (error) {
        console.error('Erro ao buscar filtros de pedidos:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}