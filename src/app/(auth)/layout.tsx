// src/app/(auth)/layout.tsx
'use client'

import { Providers } from '@/src/components/Providers'
import { ThemeProvider } from '@/src/components/ThemeProvider'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background">
            {children}
        </div>
    )
}