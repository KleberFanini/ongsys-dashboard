export interface Supplier {
    id: number
    codigo?: string
    nome: string
    documento?: string
    tipo_pessoa?: 'F' | 'J'
    email?: string
    telefone?: string
    celular?: string
    endereco?: any
    dados_bancarios?: any
    contatos?: any
    observacoes?: string
    imported_at: string
}

// Para uso no frontend (mapeado)
export interface SupplierView {
    id: number
    code: string
    name: string
    document: string
    personType: 'PF' | 'PJ'
    email: string
    phone: string
    city: string
    state: string
}