'use client'

import { useEffect } from 'react'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Carrega o tema salvo
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark')
        } else if (savedTheme === 'light') {
            document.documentElement.classList.remove('dark')
        } else {
            // Se não tiver tema salvo, verifica preferência do sistema
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            if (systemPrefersDark) {
                document.documentElement.classList.add('dark')
            }
        }
    }, [])

    return <>{children}</>
}