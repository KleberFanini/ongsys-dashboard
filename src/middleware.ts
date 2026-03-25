// src/middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;

        // Rotas que exigem papel de admin
        if (path.startsWith('/admin') && token?.papel !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        // Rotas que exigem papel de gestor ou admin
        if (path.startsWith('/gestor') && token?.papel !== 'gestor' && token?.papel !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: () => true,
        },
        pages: {
            signIn: '/login'
        }
    }
);

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/admin/:path*',
        '/gestor/:path*',
        '/api/dashboard/:path*'
    ]
};