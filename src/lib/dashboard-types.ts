// ongsys-dashboard/src/lib/dashboard-types.ts
export interface DashboardSummary {
    totalSuppliers: number
    totalProducts: number
    lowStockProducts: number
    totalPayable: number
    totalReceivable: number
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