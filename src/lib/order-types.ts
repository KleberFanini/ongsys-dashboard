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
    comentarios?: string
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

// NOVAS DEFINIÇÕES PARA ETAPAS (RESTAURADAS)
export interface EtapaInfo {
    nome: string
    descricao: string
    palavrasChave: string[]
}

export const ETAPAS: EtapaInfo[] = [
    {
        nome: 'ETAPA 01',
        descricao: 'Criação da Requisição',
        palavrasChave: ['Criou', 'Editou']
    },
    {
        nome: 'ETAPA 02',
        descricao: 'Aprovação da Requisição',
        palavrasChave: ['Aprovou a requisição']
    },
    {
        nome: 'ETAPA 03',
        descricao: 'Cotação',
        palavrasChave: ['Preencheu a cotação', 'Enviou a cotação']
    },
    {
        nome: 'ETAPA 04',
        descricao: 'Aprovação da Cotação',
        palavrasChave: ['Aprovou a cotação', 'Marcou o pedido']
    },
    {
        nome: 'ETAPA 05',
        descricao: 'Finalização',
        palavrasChave: ['Encerrou']
    }
]

// Função para identificar qual ETAPA um log pertence
export function identificarEtapa(log: LogPedido): string | null {
    const acao = log.acao.toLowerCase()
    for (const etapa of ETAPAS) {
        for (const palavra of etapa.palavrasChave) {
            if (acao.includes(palavra.toLowerCase())) {
                return etapa.nome
            }
        }
    }
    return null
}

// Função para agrupar logs por ETAPA
export function agruparLogsPorEtapa(logs: LogPedido[]): Record<string, LogPedido[]> {
    const grupos: Record<string, LogPedido[]> = {}

    logs.forEach(log => {
        const etapa = identificarEtapa(log)
        if (etapa) {
            if (!grupos[etapa]) {
                grupos[etapa] = []
            }
            grupos[etapa].push(log)
        }
    })

    return grupos
}

// Interface para estatísticas de etapas
export interface EtapaEstatistica {
    nome: string
    descricao: string
    quantidade: number
}