'use client'

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

type Role = 'SUPER_ADMIN' | 'OPERADOR_SEDE' | 'CONSULTOR' | 'SEPOD'

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
    isSEPOD: boolean
    updateUser: (userData: Partial<User>) => Promise<void>
    refreshSession: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
    const { data: session, update, status } = useSession()
    const [isLoading, setIsLoading] = useState(true)
    const isAuthenticated = status === 'authenticated'

    useEffect(() => {
        setIsLoading(status === 'loading')
    }, [status])

    const user = session?.user as User | undefined
    const role = user?.role
    const centroCusto = user?.centrosCusto?.[0]

    const isSuperAdmin = role === 'SUPER_ADMIN'
    const isOperadorSede = role === 'OPERADOR_SEDE'
    const isConsultor = role === 'CONSULTOR'
    const isSepod = role === 'SEPOD'

    console.log('🔒 useAuth - Role:', role, 'Centros:', centroCusto)

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
        isSEPOD: role === 'SEPOD',
        updateUser,
        refreshSession
    }
}