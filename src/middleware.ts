// src/middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token
        const path = req.nextUrl.pathname

        // Rotas protegidas por nível de acesso
        const rolePermissions: Record<string, string[]> = {
            SUPER_ADMIN: ['/dashboard', '/admin', '/usuarios', '/relatorios'],
            OPERADOR_SEDE: ['/dashboard', '/relatorios'],
            CONSULTOR: ['/dashboard']
        }

        const allowedPaths = rolePermissions[token?.role as string] || []
        const isAllowed = allowedPaths.some(p => path.startsWith(p))

        if (!isAllowed) {
            return NextResponse.redirect(new URL('/dashboard', req.url))
        }

        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token
        },
        pages: {
            signIn: '/login'
        }
    }
)

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/admin/:path*',
        '/usuarios/:path*',
        '/relatorios/:path*',
        '/pedidos/:path*',
        '/fornecedores/:path*',
        '/produtos/:path*'
    ]
}