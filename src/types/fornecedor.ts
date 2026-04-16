// src/types/fornecedor.ts
export interface Fornecedor {
    id: number
    nome: string
    documento: string  // CNPJ ou CPF
    tipo_pessoa?: 'FISICA' | 'JURIDICA'
    email?: string
    telefone?: string
    celular?: string
    endereco?: string
    numero?: string
    complemento?: string
    bairro?: string
    cidade?: string
    estado?: string
    cep?: string
    contato_nome?: string
    contato_email?: string
    contato_telefone?: string
    ativo?: boolean
    observacao?: string
    created_at?: string
    updated_at?: string
}

export interface FornecedorResumo {
    id: number
    nome: string
    documento: string
    total_compras?: number
    ultima_compra?: string
}