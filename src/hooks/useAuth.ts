// src/hooks/useAuth.ts
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAuth(requiredRole?: string) {
    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (status === 'loading') return
        if (!session) {
            router.push('/login')
        }
    }, [session, status, router])

    console.log('🔐 useAuth status:', { status, hasSession: !!session, role: session?.user?.role })

    return {
        session,
        isLoading: status === 'loading',
        isAuthenticated: !!session,
        user: session?.user,
        role: session?.user?.role,
    }
} ''