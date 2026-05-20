'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { useAuth } from "@/src/hooks/useAuth"
import { User, Mail, Building2, Shield, Save, Camera } from "lucide-react"
import { useSimpleToast } from "@/src/components/ui/toast-simple"
import { dispatchUserUpdated } from '@/src/events/userUpdated'

interface PerfilModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PerfilModal({ open, onOpenChange }: PerfilModalProps) {
    const { user, updateUser } = useAuth()
    const { showToast, ToastContainer } = useSimpleToast()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        cargo: '',
        avatar: ''
    })

    useEffect(() => {
        if (user) {
            setFormData({
                nome: user.name || '',
                email: user.email || '',
                telefone: (user as any).telefone || '',
                cargo: (user as any).cargo || '',
                avatar: (user as any).avatar || ''
            })
        }
    }, [user])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch('/api/usuario/perfil', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: formData.nome,
                    email: formData.email,
                    telefone: formData.telefone,
                    cargo: formData.cargo,
                    avatar: formData.avatar
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erro ao atualizar perfil')
            }

            const data = await response.json()

            console.log('📦 Dados recebidos da API:', data)
            console.log('🚀 Vou disparar evento com:', { name: data.name, email: data.email })

            // 🔥 Atualiza a sessão localmente
            dispatchUserUpdated({
                name: data.name,
                email: data.email,
                role: data.role,
                centrosCusto: data.centrosCusto
            })

            console.log('✅ Evento disparado!')

            // 🔥 Dispara evento para atualizar outros componentes (TopBar)
            dispatchUserUpdated({
                name: data.name,
                email: data.email,
                role: data.role,
                centrosCusto: data.centrosCusto
            })

            showToast('Perfil atualizado com sucesso!', 'success')

            setTimeout(() => {
                onOpenChange(false)
            }, 500)

        } catch (error) {
            console.error('Erro:', error)
            showToast(error instanceof Error ? error.message : 'Erro ao atualizar perfil', 'error')
        } finally {
            setLoading(false)
        }
    }

    const getInitials = (nome: string) => {
        if (!nome) return 'U'
        return nome
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <>
            <ToastContainer />
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Meu Perfil</DialogTitle>
                        <DialogDescription>
                            Gerencie suas informações pessoais e preferências de conta.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                        {/* Avatar */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative">
                                <Avatar className="w-24 h-24">
                                    <AvatarImage src={formData.avatar} />
                                    <AvatarFallback className="text-2xl bg-primary/10">
                                        {getInitials(formData.nome || 'Usuário')}
                                    </AvatarFallback>
                                </Avatar>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="absolute -bottom-2 -right-2 rounded-full p-1 h-8 w-8"
                                    type="button"
                                >
                                    <Camera className="w-4 h-4" />
                                </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">Clique na câmera para alterar a foto</p>
                        </div>

                        {/* Informações do usuário */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="nome">Nome completo</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="nome"
                                        value={formData.nome}
                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                        className="pl-9"
                                        placeholder="Seu nome completo"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="pl-9"
                                        placeholder="seu@email.com"
                                        required
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="telefone">Telefone</Label>
                                <Input
                                    id="telefone"
                                    value={formData.telefone}
                                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                    placeholder="(00) 00000-0000"
                                />
                                <p className="text-xs text-muted-foreground">
                                    ⚠️ Campo não está sendo salvo (não existe no banco de dados)
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cargo">Cargo</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="cargo"
                                        value={formData.cargo}
                                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                                        className="pl-9"
                                        placeholder="Seu cargo na organização"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    ⚠️ Campo não está sendo salvo (não existe no banco de dados)
                                </p>
                            </div>

                            {/* Informação da role (apenas leitura) */}
                            <div className="bg-muted/30 p-3 rounded-lg">
                                <div className="flex items-center gap-2 text-sm">
                                    <Shield className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Nível de acesso:</span>
                                    <span className="font-medium">
                                        {user?.role === 'SUPER_ADMIN' && 'Super Administrador'}
                                        {user?.role === 'OPERADOR_SEDE' && 'Operador Sede'}
                                        {user?.role === 'CONSULTOR' && 'Consultor'}
                                    </span>
                                </div>
                                {user?.role === 'CONSULTOR' && user?.centrosCusto?.length > 0 && (
                                    <div className="flex items-center gap-2 text-sm mt-2">
                                        <Building2 className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Centros de custo:</span>
                                        <span className="text-xs">
                                            {user.centrosCusto.join(', ')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Botões */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading} className="flex-1">
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? 'Salvando...' : 'Salvar alterações'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}