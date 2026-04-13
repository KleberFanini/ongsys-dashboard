import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Definindo o tipo Role manualmente
type Role = 'SUPER_ADMIN' | 'OPERADOR_SEDE' | 'CONSULTOR'

declare module 'next-auth' {
    interface User {
        id: string
        role: Role
        nome: string
    }
    interface Session {
        user: {
            id: string
            email: string
            name: string
            role: Role
        }
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string
        role: Role
        nome: string
    }
}

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

                // Garantir que o role é do tipo correto
                const role = usuario.role as Role

                return {
                    id: usuario.id,
                    email: usuario.email,
                    name: usuario.nome,
                    role: role,
                    nome: usuario.nome
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role as Role
                token.nome = user.nome
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as Role
                session.user.name = token.nome as string
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
    secret: process.env.NEXTAUTH_SECRET
}