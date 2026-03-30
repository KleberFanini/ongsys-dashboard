// src/app/login/page.tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogIn, Mail, Lock } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [senha, setSenha] = useState('')
    const [erro, setErro] = useState('')
    const [carregando, setCarregando] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setCarregando(true)
        setErro('')

        try {
            const result = await signIn('credentials', {
                email,
                senha,
                redirect: false
            })

            if (result?.error) {
                setErro(result.error)
            } else {
                router.push('/dashboard')
                router.refresh()
            }
        } catch (error) {
            setErro('Erro ao fazer login')
        } finally {
            setCarregando(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl shadow-lg p-8 w-full max-w-md border"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <LogIn className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">OngSys Dashboard</h1>
                    <p className="text-muted-foreground mt-2">Faça login para continuar</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10"
                                placeholder="seu@email.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="password"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className="pl-10"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {erro && (
                        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2 rounded-lg text-sm">
                            {erro}
                        </div>
                    )}

                    <Button type="submit" disabled={carregando} className="w-full">
                        {carregando ? 'Entrando...' : 'Entrar'}
                    </Button>
                </form>
            </motion.div>
        </div>
    )
}