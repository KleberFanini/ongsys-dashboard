import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

type UserRole = 'SUPER_ADMIN' | 'OPERADOR_SEDE' | 'CONSULTOR' | 'SEPOD'

declare module 'next-auth' {
    interface User {
        id: string
        role: UserRole
        nome: string
        centrosCusto: string[]
    }
    interface Session {
        user: {
            id: string
            email: string
            name: string
            role: UserRole
            centrosCusto: string[]
        }
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string
        role: UserRole
        nome: string
        centrosCusto: string[]
    }
}

const isProduction = process.env.NODE_ENV === 'production'

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
                    role: usuario.role as UserRole,
                    centrosCusto: usuario.centrosCusto || []
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role as UserRole
                token.nome = user.nome
                token.centrosCusto = user.centrosCusto || []
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as UserRole
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
}