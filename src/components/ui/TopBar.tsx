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
    Sun,
    Shield,
    Building2,
    User as UserIcon
} from 'lucide-react'
import { useSidebar } from './sidebar'
import { Button } from './button'
import { Badge } from './badge'
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

// Função para obter o ícone e cor baseado no role
const getRoleInfo = (role: string | undefined) => {
    switch (role) {
        case 'SUPER_ADMIN':
            return {
                icon: <Shield className="w-3 h-3 mr-1" />,
                label: 'Super Admin',
                color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                badgeColor: 'border-purple-500 text-purple-600'
            }
        case 'OPERADOR_SEDE':
            return {
                icon: <Building2 className="w-3 h-3 mr-1" />,
                label: 'Operador Sede',
                color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                badgeColor: 'border-blue-500 text-blue-600'
            }
        case 'CONSULTOR':
            return {
                icon: <UserIcon className="w-3 h-3 mr-1" />,
                label: 'Consultor',
                color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                badgeColor: 'border-green-500 text-green-600'
            }
        default:
            return {
                icon: <UserIcon className="w-3 h-3 mr-1" />,
                label: 'Usuário',
                color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
                badgeColor: 'border-gray-500 text-gray-600'
            }
    }
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

    const roleInfo = getRoleInfo(session?.user?.role)

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
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {getUserInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="hidden md:flex flex-col items-start text-sm">
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium text-foreground">
                                                {session?.user?.name || 'Usuário'}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] px-1.5 py-0 ${roleInfo.badgeColor}`}
                                            >
                                                {roleInfo.icon}
                                                {roleInfo.label}
                                            </Badge>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {session?.user?.email || ''}
                                        </span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col gap-1">
                                        <span>{session?.user?.name || 'Usuário'}</span>
                                        <span className="text-xs text-muted-foreground font-normal">
                                            {session?.user?.email || ''}
                                        </span>
                                    </div>
                                </DropdownMenuLabel>
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