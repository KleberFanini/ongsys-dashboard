// src/middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token

        // Ignorar durante desenvolvimento/hot reload
        if (process.env.NODE_ENV === 'development' && req.nextUrl.pathname.includes('/_next')) {
            return NextResponse.next()
        }

        // Apenas verificar se está autenticado
        // As permissões específicas serão tratadas nas páginas individuais
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
        '/pedidos/:path*',
        '/fornecedores/:path*',
        '/produtos/:path*',
        '/admin/:path*',
        '/configuracoes/:path*',
        '/teste-permissoes/:path*'
    ]
}