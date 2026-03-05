'use client'

import { createContext, useContext, useState, forwardRef } from 'react'
import { cn } from '@/src/lib/utils'
import { Slot } from '@radix-ui/react-slot'

interface SidebarContextType {
    state: 'expanded' | 'collapsed'
    toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function useSidebar() {
    const context = useContext(SidebarContext)
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider')
    }
    return context
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<'expanded' | 'collapsed'>('expanded')

    const toggleSidebar = () => {
        setState(state === 'expanded' ? 'collapsed' : 'expanded')
    }

    return (
        <SidebarContext.Provider value={{ state, toggleSidebar }}>
            {children}
        </SidebarContext.Provider>
    )
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    collapsible?: 'icon' | 'none'
}

export function Sidebar({ className, collapsible = 'none', children, ...props }: SidebarProps) {
    const { state } = useSidebar()
    const collapsed = state === 'collapsed'

    return (
        <div
            className={cn(
                'flex h-full flex-col border-r transition-all duration-300',
                // CORES FIXAS - não dependem do tema
                'bg-[hsl(222,47%,11%)] text-[hsl(210,40%,98%)] border-[hsl(222,47%,18%)]',
                collapsed ? 'w-16' : 'w-64',
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

export function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('flex-1 overflow-auto', className)} {...props} />
    )
}

export function SidebarGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('py-2', className)} {...props} />
    )
}

export function SidebarGroupLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn(
            'px-3 py-2 text-xs font-semibold',
            'text-[hsl(210,40%,80%)]',  // Texto um pouco mais suave
            className
        )} {...props} />
    )
}

export function SidebarGroupContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('px-2', className)} {...props} />
    )
}

export function SidebarMenu({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
    return (
        <ul className={cn('space-y-1', className)} {...props} />
    )
}

export function SidebarMenuItem({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) {
    return (
        <li className={cn('list-none', className)} {...props} />
    )
}

export const SidebarMenuButton = forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
        asChild?: boolean
    }
>(({ className, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
        <Comp
            ref={ref}
            className={cn(
                'flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors',
                'text-[hsl(210,40%,90%)] hover:bg-[hsl(222,47%,16%)] hover:text-white',
                className
            )}
            {...props}
        >
            {children}
        </Comp>
    )
})

SidebarMenuButton.displayName = 'SidebarMenuButton'

export function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn(
            'mt-auto border-t p-2',
            'border-[hsl(222,47%,18%)]',
            className
        )} {...props} />
    )
}