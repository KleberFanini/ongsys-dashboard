// ongsys-dashboard/src/lib/types.ts

// ===== CONTAS A PAGAR =====
export interface ContaPagar {
    id: number
    codigo?: string
    fornecedor_nome?: string
    fornecedor_documento?: string
    data_emissao?: string
    data_vencimento?: string
    data_pagamento?: string
    valor_bruto?: number
    valor_liquido?: number
    descricao?: string
    categoria?: string
    status?: string // 'pendente', 'pago', 'atrasado', etc
    aliquota_irrf?: number
    aliquota_iss?: number
    aliquota_pis?: number
    aliquota_cofins?: number
    rateios?: any // JSONB
    baixas?: any // JSONB
    dados_completos?: any // JSONB
    imported_at: string
    api_page?: number
}

// ===== CONTAS A RECEBER =====
export interface ContaReceber {
    id: number
    codigo?: string
    cliente_nome?: string
    cliente_documento?: string
    data_emissao?: string
    data_vencimento?: string
    data_recebimento?: string
    valor_bruto?: number
    valor_liquido?: number
    descricao?: string
    tipo_receita?: string
    status?: string
    aliquota_irrf?: number
    aliquota_iss?: number
    aliquota_pis?: number
    aliquota_cofins?: number
    rateios?: any
    recebimentos?: any
    dados_completos?: any
    imported_at: string
    api_page?: number
}

// ===== PEDIDOS =====
export interface Pedido {
    id: number
    codigo_pedido?: string
    data_emissao?: string
    data_vencimento?: string
    valor_total?: number
    cliente_nome?: string
    cliente_documento?: string
    status?: string
    aliquota_irrf?: number
    aliquota_iss?: number
    itens?: any // JSONB - array de itens do pedido
    rateios?: any
    dados_completos?: any
    imported_at: string
    api_page?: number
}

// ===== PRODUTOS =====
export interface Produto {
    id: number
    codigo?: string
    codigo_barras?: string
    nome: string
    descricao?: string
    categoria?: string
    unidade_medida?: string
    preco_custo?: number
    preco_venda?: number
    estoque_atual?: number
    estoque_minimo?: number
    ncm?: string
    cest?: string
    aliquota_icms?: number
    aliquota_ipi?: number
    aliquota_pis?: number
    aliquota_cofins?: number
    dados_completos?: any
    imported_at: string
    api_page?: number
}

// ===== FORNECEDORES =====
export interface Fornecedor {
    id: number
    codigo?: string
    nome: string
    documento?: string
    tipo_pessoa?: 'F' | 'J' // F-Física, J-Jurídica
    email?: string
    telefone?: string
    celular?: string
    endereco?: any // JSONB
    dados_bancarios?: any // JSONB
    contatos?: any // JSONB
    observacoes?: string
    dados_completos?: any
    imported_at: string
    api_page?: number
}

// ===== CLIENTES (inferido de contas_receber) =====
export interface Cliente {
    id: number
    nome: string
    documento?: string
    email?: string
    telefone?: string
    // Podemos expandir se tiver tabela própria
}

// ===== TIPOS AUXILIARES =====
export type StatusFinanceiro = 'pendente' | 'pago' | 'recebido' | 'atrasado' | 'cancelado'

export interface ResumoFinanceiro {
    total_a_pagar: number
    total_a_receber: number
    saldo: number
    vencidos: number
    a_vencer: number
}

export interface FiltroData {
    data_inicio?: string
    data_fim?: string
    status?: string
}