// src/middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token
        const path = req.nextUrl.pathname

        // Rotas protegidas do dashboard
        if (path.startsWith('/dashboard') && !token) {
            return NextResponse.redirect(new URL('/login', req.url))
        }

        // Redirecionar login se já estiver autenticado
        if (path === '/login' && token) {
            return NextResponse.redirect(new URL('/dashboard', req.url))
        }

        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token }) => true
        }
    }
)

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/pedidos/:path*',
        '/fornecedores/:path*',
        '/produtos/:path*',
        '/login'
    ]
}