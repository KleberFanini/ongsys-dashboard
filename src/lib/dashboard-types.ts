export interface DashboardSummary {
    totalProductOrders: number
    totalProductOrdersValue: number
    totalServiceOrders: number
    totalServiceOrdersValue: number

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