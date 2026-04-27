import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

declare module 'next-auth' {
    interface User {
        id: string
        role: string
        nome: string
        centrosCusto: string[]
    }
    interface Session {
        user: {
            id: string
            email: string
            name: string
            role: string
            centrosCusto: string[]
        }
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string
        role: string
        nome: string
        centrosCusto: string[]
    }
}

// 🔥 Detecta a URL base do ambiente
const isProduction = process.env.NODE_ENV === 'production'
const productionUrl = 'https://cdc-ezpoint-ongsys-dashboard.oxhwsy.easypanel.host'

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                senha: { label: 'Senha', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.senha) {
                    throw new Error('Email e senha obrigatórios')
                }

                const usuario = await prisma.usuario.findUnique({
                    where: { email: credentials.email }
                })

                console.log('🔍 Usuario encontrado:', {
                    email: usuario?.email,
                    role: usuario?.role,
                    centrosCusto: usuario?.centrosCusto,
                    centrosCustoType: typeof usuario?.centrosCusto
                })

                const centrosCusto = usuario?.centrosCusto || []
                console.log('🔍 centrosCusto após normalização:', centrosCusto)

                if (!usuario) {
                    throw new Error('Usuário não encontrado')
                }

                if (!usuario.ativo) {
                    throw new Error('Usuário desativado')
                }

                const senhaValida = await bcrypt.compare(credentials.senha, usuario.senha)

                if (!senhaValida) {
                    throw new Error('Senha incorreta')
                }

                return {
                    id: usuario.id,
                    email: usuario.email,
                    nome: usuario.nome,
                    role: usuario.role,
                    centrosCusto: usuario.centrosCusto || []
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.nome = user.nome
                token.centrosCusto = user.centrosCusto || []
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
                session.user.name = token.nome as string
                session.user.centrosCusto = token.centrosCusto as string[]
            }
            return session
        }
    },
    pages: {
        signIn: '/login',
        error: '/login'
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60
    },
    secret: process.env.NEXTAUTH_SECRET,
    cookies: isProduction ? {
        sessionToken: {
            name: `__Secure-next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: true,
                domain: '.oxhwsy.easypanel.host' // Domínio principal
            }
        },
        callbackUrl: {
            name: `__Secure-next-auth.callback-url`,
            options: {
                sameSite: 'lax',
                path: '/',
                secure: true,
                domain: '.oxhwsy.easypanel.host'
            }
        },
        csrfToken: {
            name: `__Host-next-auth.csrf-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: true
            }
        },
    } : undefined,
}