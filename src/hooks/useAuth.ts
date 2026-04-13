import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

export type Role = 'SUPER_ADMIN' | 'OPERADOR_SEDE' | 'CONSULTOR'

export function useAuth(requiredRole?: Role) {
    const { data: session, status } = useSession()
    const router = useRouter()
    const hasRedirected = useRef(false)

    useEffect(() => {
        if (status === 'loading') return
        if (hasRedirected.current) return

        if (!session) {
            hasRedirected.current = true
            router.push('/login')
            return
        }

        if (requiredRole && session.user?.role !== requiredRole && session.user?.role !== 'SUPER_ADMIN') {
            hasRedirected.current = true
            router.push('/dashboard')
            return
        }
    }, [session, status, router, requiredRole])

    const role = session?.user?.role as Role | undefined
    const centroCusto = session?.user?.centroCusto as string | undefined

    return {
        session,
        isLoading: status === 'loading',
        isAuthenticated: !!session,
        user: session?.user,
        role,
        centroCusto,
        isSuperAdmin: role === 'SUPER_ADMIN',
        isOperador: role === 'OPERADOR_SEDE',
        isConsultor: role === 'CONSULTOR'
    }
}