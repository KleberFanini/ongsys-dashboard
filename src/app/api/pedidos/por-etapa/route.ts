// src/app/api/pedidos/por-etapa/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pedidosService } from '@/src/lib/api/services';

const ETAPAS = [
    { nome: 'ETAPA 01', ordem: 1, descricao: 'Criação da Requisição', palavrasChave: ['criou a requisição', 'criou requisição'] },
    { nome: 'ETAPA 02', ordem: 2, descricao: 'Aprovação', palavrasChave: ['aprovou a requisição', 'aprovou a cotação'] },
    { nome: 'ETAPA 03', ordem: 3, descricao: 'Cotação', palavrasChave: ['preencheu a cotação', 'enviou a cotação'] },
    { nome: 'ETAPA 04', ordem: 4, descricao: 'Pedido ao Fornecedor', palavrasChave: ['enviou o pedido ao fornecedor', 'marcou o pedido como enviado'] },
    { nome: 'ETAPA 05', ordem: 5, descricao: 'Finalização', palavrasChave: ['encerrou o pedido', 'finalizado'] }
];

function identificarEtapaAtual(pedido: any): string {
    const logs = pedido.logs || [];

    for (const log of logs) {
        const acao = log.acao?.toLowerCase() || '';
        if (acao.includes('cancel') || acao.includes('negado') || acao.includes('recusado')) {
            return 'CANCELADO';
        }
    }

    for (let i = ETAPAS.length - 1; i >= 0; i--) {
        const etapa = ETAPAS[i];
        for (const log of logs) {
            const acao = log.acao?.toLowerCase() || '';
            if (etapa.palavrasChave.some(palavra => acao.includes(palavra))) {
                return etapa.nome;
            }
        }
    }

    return 'ETAPA 01';
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const etapaFiltro = searchParams.get('etapa');

        // 🔥 Buscar apenas a primeira página para estatísticas (mais rápido)
        const primeiraPagina = await pedidosService.listar({}, 1);
        const pedidos = primeiraPagina.data || [];

        // Calcular estatísticas
        const estatisticas = ETAPAS.map(etapa => ({
            nome: etapa.nome,
            ordem: etapa.ordem,
            descricao: etapa.descricao,
            quantidade: 0,
            tempoMedio: 0
        }));

        let cancelados = 0;

        pedidos.forEach((pedido: any) => {
            const etapa = identificarEtapaAtual(pedido);
            if (etapa === 'CANCELADO') {
                cancelados++;
            } else {
                const etapaInfo = estatisticas.find(e => e.nome === etapa);
                if (etapaInfo) etapaInfo.quantidade++;
            }
        });

        const estatisticasComCancelados = [
            ...estatisticas,
            { nome: 'CANCELADO', ordem: 99, descricao: 'Pedidos cancelados', quantidade: cancelados, tempoMedio: 0 }
        ];

        // Se tiver filtro de etapa, buscar a página específica
        if (etapaFiltro && etapaFiltro !== 'Todas') {
            // Para o filtro, buscamos mais páginas
            const todosPedidos = await pedidosService.listarTodos({});
            const pedidosFiltrados = todosPedidos.filter((pedido: any) => {
                const etapa = identificarEtapaAtual(pedido);
                return etapa === etapaFiltro;
            });

            const pedidosAdaptados = pedidosFiltrados.slice(0, 50).map((p: any) => ({
                id: p.idPedido,
                id_pedido: p.idPedido,
                titulo: p.titulo,
                status_pedido: p.statusPedido,
                fornecedor_nome: p.fornecedor?.nome,
                data_pedido: p.dataPedido,
                tipo_pedido: p.tipoPedido
            }));

            return NextResponse.json({
                pedidos: pedidosAdaptados,
                total: pedidosFiltrados.length,
                estatisticas: estatisticasComCancelados
            });
        }

        return NextResponse.json({
            estatisticas: estatisticasComCancelados,
            total: pedidos.length
        });
    } catch (error) {
        console.error('Erro ao buscar pedidos por etapa:', error);
        return NextResponse.json(
            { estatisticas: [], total: 0 },
            { status: 200 }
        );
    }
}