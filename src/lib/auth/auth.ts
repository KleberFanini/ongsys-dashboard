import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/src/lib/prisma'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'

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

                return {
                    id: usuario.id,
                    email: usuario.email,
                    name: usuario.nome,
                    role: usuario.role
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.nome = user.name
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
        maxAge: 30 * 24 * 60 * 60 // 30 dias
    },
    secret: process.env.NEXTAUTH_SECRET
}