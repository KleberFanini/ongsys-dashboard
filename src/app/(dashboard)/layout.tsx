// src/app/(dashboard)/layout.tsx
'use client'

import { AppSidebar } from '@/src/components/AppSidebar'
import { TopBar } from '@/src/components/ui/TopBar'
import { SidebarProvider } from '@/src/components/ui/sidebar'
import { useAuth } from '@/src/hooks/useAuth'
import { Skeleton } from '@/src/components/ui/skeleton'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isLoading, isAuthenticated } = useAuth()
    const router = useRouter()

    console.log('📦 DashboardLayout:', { isLoading, isAuthenticated })

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            console.log('🔴 Redirecionando para login...')
            router.push('/login')
        }
    }, [isLoading, isAuthenticated, router])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    return (
        <SidebarProvider>
            <div className="flex h-screen overflow-hidden">
                <div className="h-full overflow-y-auto">
                    <AppSidebar />
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                    <TopBar title="Dashboard" />
                    <main className="flex-1 overflow-y-auto p-6 bg-background">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    )
}