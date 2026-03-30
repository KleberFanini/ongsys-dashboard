// src/hooks/useAuth.ts
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAuth(requiredRole?: 'SUPER_ADMIN' | 'OPERADOR_SEDE' | 'CONSULTOR') {
    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (status === 'loading') return

        if (!session) {
            router.push('/login')
            return
        }

        if (requiredRole && session.user?.role !== requiredRole) {
            router.push('/dashboard')
            return
        }
    }, [session, status, router, requiredRole])

    return {
        session,
        isLoading: status === 'loading',
        isAuthenticated: !!session,
        user: session?.user,
        role: session?.user?.role,
        isSuperAdmin: session?.user?.role === 'SUPER_ADMIN',
        isOperador: session?.user?.role === 'OPERADOR_SEDE',
        isConsultor: session?.user?.role === 'CONSULTOR'
    }
}