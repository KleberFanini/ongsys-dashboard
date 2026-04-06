// src/app/(dashboard)/admin/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/src/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/src/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/src/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/src/components/ui/select'
import { Users, Shield, UserPlus, Edit, Trash2, RefreshCw } from 'lucide-react'
import { Skeleton } from '@/src/components/ui/skeleton'

interface Usuario {
    id: string
    email: string
    nome: string
    role: 'SUPER_ADMIN' | 'OPERADOR_SEDE' | 'CONSULTOR'
    ativo: boolean
    createdAt: string
}

export default function AdminPage() {
    const { isSuperAdmin, isLoading: authLoading } = useAuth('SUPER_ADMIN')
    const [usuarios, setUsuarios] = useState<Usuario[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<Usuario | null>(null)
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        role: 'CONSULTOR' as Usuario['role']
    })

    // Buscar usuários (simulado - você precisa criar o endpoint)
    const fetchUsuarios = async () => {
        setLoading(true)
        try {
            // TODO: Criar endpoint /api/admin/usuarios
            const response = await fetch('/api/admin/usuarios')
            if (response.ok) {
                const data = await response.json()
                setUsuarios(data)
            } else {
                // Dados mock para teste
                setUsuarios([
                    {
                        id: '1',
                        email: 'admin@ongsys.com.br',
                        nome: 'Administrador',
                        role: 'SUPER_ADMIN',
                        ativo: true,
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: '2',
                        email: 'operador@teste.com',
                        nome: 'Operador Teste',
                        role: 'OPERADOR_SEDE',
                        ativo: true,
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: '3',
                        email: 'consultor@teste.com',
                        nome: 'Consultor Teste',
                        role: 'CONSULTOR',
                        ativo: true,
                        createdAt: new Date().toISOString()
                    }
                ])
            }
        } catch (error) {
            console.error('Erro ao buscar usuários:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isSuperAdmin) {
            fetchUsuarios()
        }
    }, [isSuperAdmin])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = editingUser
                ? `/api/admin/usuarios/${editingUser.id}`
                : '/api/admin/usuarios'
            const method = editingUser ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                fetchUsuarios()
                setDialogOpen(false)
                setEditingUser(null)
                setFormData({ nome: '', email: '', senha: '', role: 'CONSULTOR' })
            }
        } catch (error) {
            console.error('Erro ao salvar usuário:', error)
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este usuário?')) {
            try {
                const response = await fetch(`/api/admin/usuarios/${id}`, {
                    method: 'DELETE'
                })
                if (response.ok) {
                    fetchUsuarios()
                }
            } catch (error) {
                console.error('Erro ao excluir usuário:', error)
            }
        }
    }

    const handleEdit = (usuario: Usuario) => {
        setEditingUser(usuario)
        setFormData({
            nome: usuario.nome,
            email: usuario.email,
            senha: '',
            role: usuario.role
        })
        setDialogOpen(true)
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'SUPER_ADMIN':
                return <Badge className="bg-purple-500">Super Admin</Badge>
            case 'OPERADOR_SEDE':
                return <Badge className="bg-blue-500">Operador Sede</Badge>
            case 'CONSULTOR':
                return <Badge className="bg-green-500">Consultor</Badge>
            default:
                return <Badge>{role}</Badge>
        }
    }

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!isSuperAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6">
                <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg max-w-md text-center">
                    <Shield className="w-12 h-12 mx-auto mb-3" />
                    <h2 className="font-semibold text-lg">Acesso Negado</h2>
                    <p className="text-sm mt-1">
                        Você não tem permissão para acessar esta página.
                        Apenas administradores podem acessar o painel de controle.
                    </p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Administração</h1>
                    <p className="text-muted-foreground">
                        Gerencie usuários e permissões do sistema
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchUsuarios}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Atualizar
                    </Button>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => {
                                setEditingUser(null)
                                setFormData({ nome: '', email: '', senha: '', role: 'CONSULTOR' })
                            }}>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Novo Usuário
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingUser
                                        ? 'Edite as informações do usuário'
                                        : 'Adicione um novo usuário ao sistema'}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4 py-4">
                                    <div>
                                        <Label htmlFor="nome">Nome</Label>
                                        <Input
                                            id="nome"
                                            value={formData.nome}
                                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="senha">
                                            Senha {editingUser && '(deixe em branco para manter)'}
                                        </Label>
                                        <Input
                                            id="senha"
                                            type="password"
                                            value={formData.senha}
                                            onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                                            required={!editingUser}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="role">Nível de Acesso</Label>
                                        <Select
                                            value={formData.role}
                                            onValueChange={(value) => setFormData({ ...formData, role: value as Usuario['role'] })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o nível" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SUPER_ADMIN">Super Administrador</SelectItem>
                                                <SelectItem value="OPERADOR_SEDE">Operador Sede</SelectItem>
                                                <SelectItem value="CONSULTOR">Consultor</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit">
                                        {editingUser ? 'Salvar' : 'Criar'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Cards de estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total de Usuários
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{usuarios.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Administradores
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {usuarios.filter(u => u.role === 'SUPER_ADMIN').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Usuários Ativos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {usuarios.filter(u => u.ativo).length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabela de usuários */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Lista de Usuários
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Nível</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Data Cadastro</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {usuarios.map((usuario) => (
                                <TableRow key={usuario.id}>
                                    <TableCell className="font-medium">{usuario.nome}</TableCell>
                                    <TableCell>{usuario.email}</TableCell>
                                    <TableCell>{getRoleBadge(usuario.role)}</TableCell>
                                    <TableCell>
                                        <Badge variant={usuario.ativo ? 'default' : 'destructive'}>
                                            {usuario.ativo ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(usuario.createdAt).toLocaleDateString('pt-BR')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(usuario)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive"
                                                onClick={() => handleDelete(usuario.id)}
                                                disabled={usuario.role === 'SUPER_ADMIN' && usuarios.filter(u => u.role === 'SUPER_ADMIN').length === 1}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {usuarios.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        Nenhum usuário encontrado
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}