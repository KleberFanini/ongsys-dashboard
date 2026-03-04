// ongsys-dashboard/src/components/NavLink.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { forwardRef } from 'react'
import { cn } from '@/src/lib/utils'

interface NavLinkProps {
    href: string
    children: React.ReactNode
    className?: string
    activeClassName?: string
    exact?: boolean
    includes?: string | string[] // Para rotas que devem ser ativas se incluírem certos padrões
    target?: string
    rel?: string
}

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
    ({
        href,
        children,
        className = '',
        activeClassName = '',
        exact = false,
        includes,
        target,
        rel,
        ...props
    }, ref) => {
        const pathname = usePathname()

        // Função para verificar se o link está ativo
        const checkIsActive = () => {
            if (exact) {
                return pathname === href
            }

            if (includes) {
                const patterns = Array.isArray(includes) ? includes : [includes]
                return patterns.some(pattern => pathname.includes(pattern))
            }

            return pathname.startsWith(href) && href !== '/'
        }

        const isActive = checkIsActive()

        return (
            <Link
                href={href}
                ref={ref}
                className={cn(
                    className,
                    isActive && activeClassName
                )}
                target={target}
                rel={rel}
                {...props}
            >
                {children}
            </Link>
        )
    }
)

NavLink.displayName = 'NavLink'