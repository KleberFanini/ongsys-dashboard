'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { CACHE_TTL_MS } from '@/src/lib/api/cache-config'
import { useAuth } from '@/src/hooks/useAuth'

const BATCH_SIZE = 3

interface CacheData<T> {
    data: T[]
    timestamp: number
}

interface DataContextValue<T> {
    data: T[]
    loading: boolean
    loadingProgress: { current: number; total: number }
    loadError: string | null
    reload: () => void
}

interface CreateDataContextOptions {
    cacheKey: string
    endpoint: string
}

export function createDataContext<T>(options: CreateDataContextOptions) {
    const { cacheKey, endpoint } = options

    const Context = createContext<DataContextValue<T> | null>(null)

    function Provider({ children }: { children: ReactNode }) {
        const { isAuthenticated, isLoading: authLoading } = useAuth()
        const [data, setData] = useState<T[]>([])
        const [loading, setLoading] = useState(false)
        const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 })
        const [loadError, setLoadError] = useState<string | null>(null)
        const hasLoadedRef = useRef(false)
        const abortControllerRef = useRef<AbortController | null>(null)

        const load = useCallback(async (force = false) => {
            if (!force) {
                try {
                    const cached = localStorage.getItem(cacheKey)
                    if (cached) {
                        const parsed: CacheData<T> = JSON.parse(cached)
                        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
                            setData(parsed.data)
                            return
                        }
                    }
                } catch { }
            }

            if (abortControllerRef.current) abortControllerRef.current.abort()
            const controller = new AbortController()
            abortControllerRef.current = controller

            setLoading(true)
            setLoadError(null)

            try {
                const primeiraRes = await fetch(`/api/${endpoint}?page=1`, { signal: controller.signal })
                if (!primeiraRes.ok) throw new Error(`HTTP ${primeiraRes.status}`)
                const primeiraData = await primeiraRes.json()

                const totalPaginas = Math.ceil((primeiraData.total || 0) / 100)
                let allData: T[] = [...(primeiraData.data || [])]
                setLoadingProgress({ current: 1, total: totalPaginas })

                if (totalPaginas > 1) {
                    const paginas = Array.from({ length: totalPaginas - 1 }, (_, i) => i + 2)
                    for (let i = 0; i < paginas.length; i += BATCH_SIZE) {
                        const batch = paginas.slice(i, i + BATCH_SIZE)
                        const results = await Promise.all(
                            batch.map(p =>
                                fetch(`/api/${endpoint}?page=${p}`, { signal: controller.signal })
                                    .then(r => r.json())
                                    .catch(() => ({ data: [] }))
                            )
                        )
                        results.forEach(r => allData.push(...(r.data || [])))
                        setLoadingProgress({
                            current: Math.min(i + BATCH_SIZE + 1, totalPaginas),
                            total: totalPaginas
                        })
                    }
                }

                setData(allData)

                try {
                    const cacheData: CacheData<T> = { data: allData, timestamp: Date.now() }
                    localStorage.setItem(cacheKey, JSON.stringify(cacheData))
                } catch { }

            } catch (error: any) {
                if (error.name !== 'AbortError') setLoadError(error.message)
            } finally {
                setLoading(false)
                setLoadingProgress({ current: 0, total: 0 })
            }
        }, [])

        useEffect(() => {
            if (isAuthenticated && !authLoading && !hasLoadedRef.current) {
                hasLoadedRef.current = true
                load()
            }
        }, [isAuthenticated, authLoading, load])

        return (
            <Context.Provider value={{ data, loading, loadingProgress, loadError, reload: () => load(true) }}>
                {children}
            </Context.Provider>
        )
    }

    function useData() {
        const ctx = useContext(Context)
        if (!ctx) throw new Error(`Hook deve ser usado dentro do Provider correspondente`)
        return ctx
    }

    return { Provider, useData }
}