// src/app/api/test-dashboard/route.ts
import { NextResponse } from 'next/server'
import { getDashboardSummaryFromAPI } from '@/src/lib/dashboard-queries'

export async function GET() {
    try {
        const data = await getDashboardSummaryFromAPI()
        return NextResponse.json({
            success: true,
            summary: {
                totalProductOrders: data.totalProductOrders,
                totalServiceOrders: data.totalServiceOrders,
                topSuppliersCount: data.topSuppliers.length,
                topItemsCount: data.topItems.length,
                firstSupplier: data.topSuppliers[0],
                firstItem: data.topItems[0]
            }
        })
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}