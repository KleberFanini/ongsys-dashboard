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

export interface EtapaInfo {
    nome: string
    descricao: string
    palavrasChave: string[]
    ordem: number  // Para ordenar as etapas
}

export const ETAPAS: EtapaInfo[] = [
    {
        nome: 'ETAPA 01',
        descricao: 'Criação da Requisição',
        palavrasChave: ['Criou', 'Editou'],
        ordem: 1
    },
    {
        nome: 'ETAPA 02',
        descricao: 'Aprovação da Requisição',
        palavrasChave: ['Aprovou a requisição'],
        ordem: 2
    },
    {
        nome: 'ETAPA 03',
        descricao: 'Cotação',
        palavrasChave: ['Preencheu a cotação', 'Enviou a cotação'],
        ordem: 3
    },
    {
        nome: 'ETAPA 04',
        descricao: 'Aprovação da Cotação',
        palavrasChave: ['Aprovou a cotação', 'Marcou o pedido'],
        ordem: 4
    },
    {
        nome: 'ETAPA 05',
        descricao: 'Finalização',
        palavrasChave: ['Encerrou'],
        ordem: 5
    },
    {
        nome: 'CANCELADO',
        descricao: 'Pedidos Cancelados',
        palavrasChave: ['Cancelou', 'Negado', 'Recusado', 'cancelamento'],
        ordem: 6
    }
]

// Função para identificar a ETAPA ATUAL de um pedido
export function identificarEtapaAtual(logs: LogPedido[]): string | null {
    if (!logs || logs.length === 0) return null

    // Ordenar logs por data (mais recente primeiro)
    const logsOrdenados = [...logs].sort((a, b) =>
        new Date(b.data).getTime() - new Date(a.data).getTime()
    )

    // Verificar primeiro se foi cancelado
    for (const log of logsOrdenados) {
        const acao = log.acao.toLowerCase()
        const etapaCancelado = ETAPAS.find(e => e.nome === 'CANCELADO')
        if (etapaCancelado?.palavrasChave.some(palavra => acao.includes(palavra.toLowerCase()))) {
            return 'CANCELADO'
        }
    }

    // Se não foi cancelado, encontrar a última etapa concluída
    for (let i = ETAPAS.length - 2; i >= 0; i--) { // -2 para ignorar CANCELADO
        const etapa = ETAPAS[i]
        for (const log of logsOrdenados) {
            const acao = log.acao.toLowerCase()
            if (etapa.palavrasChave.some(palavra => acao.includes(palavra.toLowerCase()))) {
                return etapa.nome
            }
        }
    }

    return null
}

// Função para identificar qual ETAPA um log pertence (mantida para a timeline)
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

// Função para agrupar logs por ETAPA (mantida para a timeline)
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
    ordem: number
}