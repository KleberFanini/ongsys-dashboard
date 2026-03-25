'use client'
import { useEffect } from 'react'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        console.log('ThemeProvider executando')

        const savedTheme = localStorage.getItem('theme')
        console.log('Tema salvo:', savedTheme)

        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark')
            console.log('Classe dark ADICIONADA')
        } else if (savedTheme === 'light') {
            document.documentElement.classList.remove('dark')
            console.log('Classe dark REMOVIDa')
        }
    }, [])

    return <>{children}</>
}