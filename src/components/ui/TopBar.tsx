'use client'

import { useState, useEffect } from 'react'
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

    // Verifica o tema inicial ao carregar
    useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark')
        setIsDarkMode(isDark)
    }, [])

    const toggleTheme = () => {
        const newDarkMode = !isDarkMode
        setIsDarkMode(newDarkMode)

        // Força a mudança do tema via media query
        if (newDarkMode) {
            document.documentElement.style.colorScheme = 'dark'
            document.documentElement.setAttribute('data-theme', 'dark')
        } else {
            document.documentElement.style.colorScheme = 'light'
            document.documentElement.setAttribute('data-theme', 'light')
        }
    }
    return (
        <header className={cn(
            "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
            className
        )}>
            <div className="flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    {/* Botão do menu para mobile/sidebar */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={toggleSidebar}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    {/* Título da página */}
                    <h1 className="text-xl font-semibold text-foreground">
                        {title}
                    </h1>
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

                    {/* Notificações */}
                    {showNotifications && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative text-muted-foreground hover:text-foreground"
                            aria-label="Notificações"
                        >
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                        </Button>
                    )}

                    {/* Menu do usuário */}
                    {showUserMenu && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-2 px-2 hover:bg-accent"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src="https://github.com/shadcn.png" />
                                        <AvatarFallback>
                                            <User className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="hidden md:flex flex-col items-start text-sm">
                                        <span className="font-medium text-foreground">Admin User</span>
                                        <span className="text-xs text-muted-foreground">admin@ongsys.com</span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Perfil</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Configurações</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
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