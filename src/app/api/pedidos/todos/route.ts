import { NextResponse } from 'next/server'
import { pedidosService } from '@/src/lib/api/services'

export async function GET() {
    try {
        const pedidos = await pedidosService.listarTodos({})
        const data = pedidos.map((p: any) => ({
            id: p.idRequisicao,
            id_requisicao: p.idRequisicao || '',
            id_pedido: p.idPedido || '',
            titulo: p.titulo || '',
            status_pedido: p.statusPedido || '',
            fornecedor_nome: p.fornecedor?.nome || '',
            fornecedor_documento: p.fornecedor?.documento || '',
            requisitante: p.requisitante || '',
            data_pedido: p.dataPedido || '',
            tipo_pedido: p.tipoPedido || '',
            local_entrega: p.localEntrega,
            itens_pedido: p.itensPedido || [],
            logs: p.logs || [],
            descricao_pedido: p.descricaoPedido || '',
            justificativa_compra: p.justificativaCompra || '',
            fonte_pagadora: p.fontePagadora || '',
            conta_plano_financeiro: p.contaPlanoFinanceiro || '',
            valor_total: p.valorTotal || 0
        }))
        return NextResponse.json({ data, total: data.length })
    } catch (error) {
        console.error('Erro ao buscar todos os pedidos:', error)
        return NextResponse.json({ data: [], total: 0 }, { status: 500 })
    }
}