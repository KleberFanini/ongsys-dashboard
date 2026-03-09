// ongsys-dashboard/src/lib/dashboard-types.ts
export interface DashboardSummary {
    // Pedidos do tipo PRODUTO
    totalProductOrders: number        // Quantidade de pedidos do tipo Produto
    totalProductOrdersValue: number    // Valor total dos pedidos do tipo Produto

    // Pedidos do tipo SERVIÇO
    totalServiceOrders: number         // Quantidade de pedidos do tipo Serviço
    totalServiceOrdersValue: number    // Valor total dos pedidos do tipo Serviço

    totalSuppliers: number
    totalPayable: number
    totalReceivable: number
    lowStockProducts: number
    monthlyData: MonthlyData[]
    unitMeasureData: UnitMeasureData[]
    recentAccounts: RecentAccount[]
}

export interface MonthlyData {
    month: string
    payable: number
    receivable: number
}

export interface UnitMeasureData {
    name: string
    value: number
    fill: string
}

export interface RecentAccount {
    id: number
    code: string
    entityName: string
    dueDate: string
    value: number
    status: 'paid' | 'pending' | 'overdue'
    type: 'payable' | 'receivable'
}