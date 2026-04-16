export interface Order {
    id: number
    id_requisicao: string
    id_pedido?: string
    titulo: string
    status_pedido: string
    fornecedor_nome: string
    fornecedor_documento?: string
    requisitante?: string
    data_pedido: string
    tipo_pedido: string
    valor_total: number
    local_entrega?: any
    itens_pedido?: any[]
    logs?: any[]
    descricao_pedido?: string
    justificativa_compra?: string
    fonte_pagadora?: string
    conta_plano_financeiro?: string
}

export type OrderStatus = 'Ordem finalizada' | 'Aguardando aprovação' | 'Em andamento' | 'Cancelado' | 'Rascunho'
export type OrderType = 'produto' | 'serviço'