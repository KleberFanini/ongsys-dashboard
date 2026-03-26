// src/app/api/pedidos/route.ts - Versão otimizada
import { NextRequest, NextResponse } from 'next/server';
import { pedidosService } from '@/src/lib/api/services';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const tipo = searchParams.get('tipo') || '';
        const limit = searchParams.get('limit');

        // 🔥 Se for uma requisição com limit (como a do frontend), buscar apenas primeira página
        if (limit === '10000') {
            const result = await pedidosService.listar({}, 1);
            const pedidos = result.data || [];

            const pedidosAdaptados = pedidos.map((p: any) => ({
                id: p.idRequisicao,
                id_Requisicao: p.idRequisicao,
                titulo: p.titulo,
                status_pedido: p.statusPedido,
                fornecedor_nome: p.fornecedor?.nome,
                fornecedor_documento: p.fornecedor?.documento,
                requisitante: p.requisitante,
                data_pedido: p.dataPedido,
                tipo_pedido: p.tipoPedido,
                local_entrega: p.localEntrega,
                itens_pedido: p.itensPedido,
                logs: p.logs,
                descricao_pedido: p.descricaoPedido,
                justificativa_compra: p.justificativaCompra
            }));

            // Calcular valor total
            pedidosAdaptados.forEach((pedido: any) => {
                if (pedido.itens_pedido && Array.isArray(pedido.itens_pedido)) {
                    pedido.valor_total = pedido.itens_pedido.reduce((acc: number, item: any) => {
                        const quantidade = parseFloat(item.quantidade) || 0;
                        const valorUnitario = parseFloat(item.valorUnitario) || 0;
                        return acc + (quantidade * valorUnitario);
                    }, 0);
                }
            });

            return NextResponse.json({
                data: pedidosAdaptados,
                total: result.totalItems,
                totalPages: result.totalPages,
                currentPage: 1
            });
        }

        // Buscar a página específica
        const result = await pedidosService.listar({}, page);

        let pedidos = result.data || [];

        // Aplicar filtros localmente
        if (search) {
            const searchLower = search.toLowerCase();
            pedidos = pedidos.filter((p: any) =>
                p.titulo?.toLowerCase().includes(searchLower) ||
                p.idRequisicao?.toLowerCase().includes(searchLower) ||
                p.fornecedor?.nome?.toLowerCase().includes(searchLower)
            );
        }

        if (status && status !== 'todos') {
            pedidos = pedidos.filter((p: any) => p.statusPedido === status);
        }

        if (tipo && tipo !== 'todos') {
            pedidos = pedidos.filter((p: any) => p.tipoPedido === tipo);
        }

        const pedidosAdaptados = pedidos.map((p: any) => ({
            id: p.idRequisicao,
            id_Requisicao: p.idRequisicao,
            titulo: p.titulo,
            status_pedido: p.statusPedido,
            fornecedor_nome: p.fornecedor?.nome,
            fornecedor_documento: p.fornecedor?.documento,
            requisitante: p.requisitante,
            data_pedido: p.dataPedido,
            tipo_pedido: p.tipoPedido,
            local_entrega: p.localEntrega,
            itens_pedido: p.itensPedido,
            logs: p.logs,
            descricao_pedido: p.descricaoPedido,
            justificativa_compra: p.justificativaCompra
        }));

        // Calcular valor total
        pedidosAdaptados.forEach((pedido: any) => {
            if (pedido.itens_pedido && Array.isArray(pedido.itens_pedido)) {
                pedido.valor_total = pedido.itens_pedido.reduce((acc: number, item: any) => {
                    const quantidade = parseFloat(item.quantidade) || 0;
                    const valorUnitario = parseFloat(item.valorUnitario) || 0;
                    return acc + (quantidade * valorUnitario);
                }, 0);
            }
        });

        return NextResponse.json({
            data: pedidosAdaptados,
            total: result.totalItems,
            totalPages: result.totalPages,
            currentPage: page
        });
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        return NextResponse.json(
            { data: [], total: 0, totalPages: 0, currentPage: 1 },
            { status: 200 }
        );
    }
}