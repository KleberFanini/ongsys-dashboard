// ongsys-dashboard/src/lib/order-types.ts
export interface Fornecedor {
    id: string
    nome: string
    documento: string
}

export interface ItemPedido {
    grupo: string
    idServico: string
    nomeServico: string
    quantidade: string
    centroCusto: string
    linkReferencia?: string
    descricao?: string
    controleEntregas: any[]
}

export interface LocalEntrega {
    responsavel: string
    cep: string
    endereco: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    estado: string
}

export interface LogPedido {
    acao: string
    data: string
    autor: string
}

export interface Order {
    id: number
    id_pedido: string
    id_requisicao?: string
    titulo?: string
    status_pedido?: string
    fornecedor_id?: string
    fornecedor_nome?: string
    fornecedor_documento?: string
    requisitante?: string
    comprador?: string
    demandante?: string
    data_pedido?: string
    numero_referencia?: string
    tipo_pedido?: string
    fonte_pagadora?: string
    conta_plano_financeiro?: string
    subprojeto?: string
    portal_transparencia?: string
    ttd?: string
    descricao_pedido?: string
    justificativa_compra?: string
    valor_total?: number
    local_entrega?: LocalEntrega
    itens_pedido?: ItemPedido[]
    logs?: LogPedido[]
}

export interface OrdersResponse {
    data: Order[]
    total: number
    page: number
    totalPages: number
}