// src/components/TopBar.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
    Menu,
    Bell,
    User,
    Settings,
    LogOut,
    ChevronDown,
    Moon,
    Sun
} from 'lucide-react'
import { useSidebar } from './sidebar'
import { Button } from './button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { cn } from '@/src/lib/utils'

interface TopBarProps {
    title?: string
    showNotifications?: boolean
    showUserMenu?: boolean
    className?: string
}

export function TopBar({
    title = "Dashboard",
    showNotifications = true,
    showUserMenu = true,
    className
}: TopBarProps) {
    const { toggleSidebar } = useSidebar()
    const [isDarkMode, setIsDarkMode] = useState(false)
    const { data: session } = useSession()
    const router = useRouter()

    // Verifica o tema inicial ao carregar
    useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark')
        setIsDarkMode(isDark)
    }, [])

    const toggleTheme = () => {
        const newDarkMode = !isDarkMode
        setIsDarkMode(newDarkMode)

        if (newDarkMode) {
            document.documentElement.classList.add('dark')
            localStorage.setItem('theme', 'dark')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('theme', 'light')
        }
    }

    const handleLogout = async () => {
        await signOut({ redirect: true, callbackUrl: '/login' })
    }

    // Obter iniciais do nome do usuário para o avatar
    const getUserInitials = () => {
        if (!session?.user?.name) return 'U'
        const names = session.user.name.split(' ')
        if (names.length === 1) return names[0].charAt(0).toUpperCase()
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
    }

    return (
        <header className={cn(
            "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
            className
        )}>
            <div className="flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={toggleSidebar}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    {title && <h1 className="text-lg font-semibold text-foreground">{title}</h1>}
                </div>

                {/* Ícones e ações da direita */}
                <div className="flex items-center gap-2">
                    {/* Botão de tema */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Alternar tema"
                    >
                        {isDarkMode ? (
                            <Sun className="h-5 w-5" />
                        ) : (
                            <Moon className="h-5 w-5" />
                        )}
                    </Button>

                    {/* Menu do usuário */}
                    {showUserMenu && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-2 px-2 hover:bg-accent"
                                >
                                    <Avatar className="h-8 w-8">
                                        {/* Removido AvatarImage pois não temos URL de imagem */}
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {getUserInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="hidden md:flex flex-col items-start text-sm">
                                        <span className="font-medium text-foreground">
                                            {session?.user?.name || 'Usuário'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {session?.user?.email || ''}
                                        </span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push('/perfil')}>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Perfil</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/configuracoes')}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Configurações</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Sair</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </header>
    )
}