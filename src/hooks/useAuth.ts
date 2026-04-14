// src/hooks/useAuth.ts
'use client'

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

type Role = 'SUPER_ADMIN' | 'OPERADOR_SEDE' | 'CONSULTOR'

interface User {
    id: string
    email: string
    name: string
    role: Role
    centrosCusto: string[]
}

interface UseAuthReturn {
    session: any
    isLoading: boolean
    isAuthenticated: boolean
    user: User | undefined
    role: Role | undefined
    centroCusto: string | undefined
    isSuperAdmin: boolean
    isOperador: boolean
    isConsultor: boolean
    updateUser: (userData: Partial<User>) => Promise<void>
    refreshSession: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
    const { data: session, update, status } = useSession()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setIsLoading(status === 'loading')
    }, [status])

    const user = session?.user as User | undefined
    const role = user?.role
    const centroCusto = user?.centrosCusto?.[0]

    const refreshSession = async () => {
        try {
            await update()
            await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
            console.error('Erro ao refresh sessão:', error)
        }
    }

    const updateUser = async (userData: Partial<User>) => {
        try {
            await update({
                ...session,
                user: {
                    ...session?.user,
                    ...userData
                }
            })
            await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
            console.error('Erro ao atualizar sessão:', error)
            throw error
        }
    }

    return {
        session,
        isLoading,
        isAuthenticated: !!session?.user,
        user,
        role,
        centroCusto,
        isSuperAdmin: role === 'SUPER_ADMIN',
        isOperador: role === 'OPERADOR_SEDE',
        isConsultor: role === 'CONSULTOR',
        updateUser,
        refreshSession
    }
}