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
        palavrasChave: [
            'Aprovou a cotação',
            'Aprovou a cotação.',
            'Marcou o pedido',
            'Gerou pedido',
            'Gerou pedido(s)'
        ],
        ordem: 4
    },
    {
        nome: 'ETAPA 05',
        descricao: 'Finalização',
        palavrasChave: ['Encerrou', 'Finalizou'],
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

// Função para calcular a diferença entre duas datas em horas/dias
export function formatarTempo(ms: number): string {
    const horas = ms / (1000 * 60 * 60)

    if (horas < 1) {
        const minutos = Math.round(horas * 60)
        return `${minutos}m`
    }

    if (horas < 24) {
        return `${Math.round(horas)}h`
    } else {
        const dias = horas / 24
        return `${dias.toFixed(1)}d`
    }
}

// Função para calcular o tempo gasto em uma etapa para um pedido
export function calcularTempoEtapa(logs: LogPedido[], etapaNome: string, pedidoId?: string): number | null {
    // ETAPAS 05 e CANCELADO não têm tempo médio
    if (etapaNome === 'ETAPA 05' || etapaNome === 'CANCELADO') {
        return null
    }

    // Encontrar a etapa correspondente
    const etapa = ETAPAS.find(e => e.nome === etapaNome)
    if (!etapa) return null

    // Filtrar logs que pertencem a esta etapa (case insensitive)
    const logsEtapa = logs
        .filter(log => {
            if (!log.acao) return false
            const acao = log.acao.toLowerCase()
            return etapa.palavrasChave.some(p => {
                const palavraLower = p.toLowerCase()
                const match = acao.includes(palavraLower)
                if (match && pedidoId) {
                    console.log(`✅ Pedido ${pedidoId} - Match ETAPA ${etapaNome}: "${log.acao}" com palavra-chave "${p}"`)
                }
                return match
            })
        })
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

    // Se não tem logs na etapa, não entrou nela ainda
    if (logsEtapa.length === 0) {
        if (pedidoId) {
            console.log(`❌ Pedido ${pedidoId} - Sem logs para ETAPA ${etapaNome}`)
        }
        return null
    }

    // Pega o primeiro log da etapa (início)
    const dataInicio = new Date(logsEtapa[0].data).getTime()
    const dataInicioStr = new Date(dataInicio).toLocaleString('pt-BR')

    // Encontrar o índice do ÚLTIMO log desta etapa no array completo de logs
    const ultimoLogDaEtapa = logsEtapa[logsEtapa.length - 1]
    const indexUltimoLog = logs.findIndex(log => log === ultimoLogDaEtapa)

    // Verificar se existe um próximo log (qualquer etapa) após o último log desta etapa
    const existeProximoLog = indexUltimoLog !== -1 && indexUltimoLog < logs.length - 1

    // Calcular a data de fim
    let dataFim: number
    let tipo: string

    if (existeProximoLog) {
        // Já passou para outra etapa - usa o próximo log como fim
        const proximoLog = logs[indexUltimoLog + 1]
        dataFim = new Date(proximoLog.data).getTime()
        tipo = 'CONCLUÍDO'
    } else {
        // Ainda está nesta etapa - usa a data atual
        dataFim = Date.now()
        tipo = 'EM ANDAMENTO'
    }

    const dataFimStr = new Date(dataFim).toLocaleString('pt-BR')
    const diferenca = dataFim - dataInicio

    // Log para debug
    if (pedidoId) {
        console.log(`📊 Pedido ${pedidoId} - ${etapaNome}:`, {
            tipo,
            logsNaEtapa: logsEtapa.length,
            inicio: dataInicioStr,
            fim: dataFimStr,
            diferenca: formatarTempo(diferenca),
            ms: diferenca,
            palavrasChave: etapa.palavrasChave
        })
    }

    return diferenca
}

// Função para calcular a média de tempo de uma etapa considerando todos os pedidos
export function calcularMediaTempoEtapa(pedidos: Order[], etapaNome: string): string {
    // ETAPAS 05 e CANCELADO não têm média
    if (etapaNome === 'ETAPA 05' || etapaNome === 'CANCELADO') {
        return '-'
    }

    const tempos: number[] = []
    console.log(`\n🔍 Calculando média para ${etapaNome} com ${pedidos.length} pedidos`)
    console.log(`📝 Palavras-chave para ${etapaNome}:`, ETAPAS.find(e => e.nome === etapaNome)?.palavrasChave)

    pedidos.forEach((pedido, index) => {
        if (!pedido.logs) return

        const logsArray = Array.isArray(pedido.logs) ? pedido.logs : [pedido.logs]

        // Mostrar logs para os primeiros 5 pedidos para debug
        const mostrarLog = index < 5
        const tempo = calcularTempoEtapa(logsArray, etapaNome, mostrarLog ? pedido.id_pedido : undefined)

        if (tempo !== null) {
            tempos.push(tempo)
        }
    })

    if (tempos.length === 0) {
        console.log(`❌ ${etapaNome}: nenhum tempo válido encontrado`)
        return '-'
    }

    const soma = tempos.reduce((a, b) => a + b, 0)
    const media = soma / tempos.length
    const resultado = formatarTempo(media)

    console.log(`✅ ${etapaNome}:`, {
        totalTempos: tempos.length,
        soma: formatarTempo(soma),
        media: resultado,
        mediaMs: media
    })

    return resultado
}