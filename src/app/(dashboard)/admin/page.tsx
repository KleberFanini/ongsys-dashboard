'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/src/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Checkbox } from '@/src/components/ui/checkbox'
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
import { Users, Shield, UserPlus, Edit, Trash2, RefreshCw, Building2 } from 'lucide-react'
import { Skeleton } from '@/src/components/ui/skeleton'
import { costCentersList, getCostCenterName } from '@/src/lib/cost-centers-map'

interface Usuario {
    id: string
    email: string
    nome: string
    role: 'SUPER_ADMIN' | 'OPERADOR_SEDE' | 'CONSULTOR' | 'SEPOD'
    ativo: boolean
    createdAt: string
    centrosCusto?: string[]
}

// 🔥 Função para filtrar centros de custo que contêm "ATITUDE"
const getAtitudeCostCenters = (): string[] => {
    return costCentersList
        .filter(centro => centro.name.toUpperCase().includes('ATITUDE'))
        .map(centro => centro.code)
}

export default function AdminPage() {
    const { isSuperAdmin, isLoading: authLoading } = useAuth()
    const [usuarios, setUsuarios] = useState<Usuario[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<Usuario | null>(null)
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        role: 'CONSULTOR' as Usuario['role'],
        centrosCusto: [] as string[]
    })

    // Buscar usuários
    const fetchUsuarios = async () => {
        setLoading(true)
        try {
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
                        createdAt: new Date().toISOString(),
                        centrosCusto: []
                    },
                    {
                        id: '2',
                        email: 'operador@teste.com',
                        nome: 'Operador Teste',
                        role: 'OPERADOR_SEDE',
                        ativo: true,
                        createdAt: new Date().toISOString(),
                        centrosCusto: []
                    },
                    {
                        id: '3',
                        email: 'consultor@teste.com',
                        nome: 'Consultor Teste',
                        role: 'CONSULTOR',
                        ativo: true,
                        createdAt: new Date().toISOString(),
                        centrosCusto: ['3.01.01.002', '3.01.02.001']
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

    // Verificar se deve mostrar o campo centros de custo
    const shouldShowCentrosCusto = formData.role === 'CONSULTOR'

    // 🔥 Quando o role mudar para SEPOD, preencher automaticamente com os centros ATITUDE
    const handleRoleChange = (value: string) => {
        const newRole = value as Usuario['role']
        
        if (newRole === 'SEPOD') {
            // Para SEPOD, preencher com todos os centros que contêm "ATITUDE"
            const atitudeCenters = getAtitudeCostCenters()
            setFormData({
                ...formData,
                role: newRole,
                centrosCusto: atitudeCenters
            })
        } else {
            setFormData({
                ...formData,
                role: newRole,
                centrosCusto: []
            })
        }
    }

    // Gerenciar seleção de centros de custo
    const handleCentroCustoToggle = (centroCode: string) => {
        setFormData(prev => {
            const isSelected = prev.centrosCusto.includes(centroCode)
            if (isSelected) {
                return {
                    ...prev,
                    centrosCusto: prev.centrosCusto.filter(code => code !== centroCode)
                }
            } else {
                return {
                    ...prev,
                    centrosCusto: [...prev.centrosCusto, centroCode]
                }
            }
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validação: consultor precisa de pelo menos um centro de custo
        if (formData.role === 'CONSULTOR' && formData.centrosCusto.length === 0) {
            alert('Para usuários CONSULTOR, pelo menos um Centro de Custo é obrigatório!')
            return
        }

        // 🔥 Validação para SEPOD: garantir que tem centros ATITUDE
        if (formData.role === 'SEPOD' && formData.centrosCusto.length === 0) {
            alert('Erro: Não foi possível associar centros de custo ATITUDE ao usuário SEPOD. Verifique se existem centros cadastrados.')
            return
        }

        try {
            const url = editingUser
                ? `/api/admin/usuarios/${editingUser.id}`
                : '/api/admin/usuarios'
            const method = editingUser ? 'PUT' : 'POST'

            const dataToSend = {
                nome: formData.nome,
                email: formData.email,
                role: formData.role,
                ...(formData.senha && { senha: formData.senha }),
                ...((formData.role === 'CONSULTOR' || formData.role === 'SEPOD') && { 
                    centrosCusto: formData.centrosCusto 
                })
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            })

            if (response.ok) {
                fetchUsuarios()
                setDialogOpen(false)
                setEditingUser(null)
                setFormData({ nome: '', email: '', senha: '', role: 'CONSULTOR', centrosCusto: [] })
            } else {
                const error = await response.json()
                alert(error.message || 'Erro ao salvar usuário')
            }
        } catch (error) {
            console.error('Erro ao salvar usuário:', error)
            alert('Erro ao salvar usuário')
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
            role: usuario.role,
            centrosCusto: usuario.centrosCusto || []
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
            case 'SEPOD':
                return <Badge className="bg-orange-500">SEPOD</Badge>
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
                                setFormData({ nome: '', email: '', senha: '', role: 'CONSULTOR', centrosCusto: [] })
                            }}>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Novo Usuário
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                                            onValueChange={handleRoleChange}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o nível" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SUPER_ADMIN">Super Administrador</SelectItem>
                                                <SelectItem value="OPERADOR_SEDE">Operador Sede</SelectItem>
                                                <SelectItem value="CONSULTOR">Consultor</SelectItem>
                                                <SelectItem value="SEPOD">SEPOD</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Campos de Centro de Custo - aparece para CONSULTOR e SEPOD */}
                                    {(shouldShowCentrosCusto || formData.role === 'SEPOD') && (
                                        <div className="space-y-3 border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 dark:bg-blue-950/30 rounded-r-md">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                <Label className="text-blue-700 dark:text-blue-300 font-semibold">
                                                    Centros de Custo Permitidos 
                                                    {formData.role === 'SEPOD' && ' (ATITUDE - Automático)'}
                                                    {formData.role === 'CONSULTOR' && ' *'}
                                                </Label>
                                            </div>
                                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                                {formData.role === 'SEPOD' 
                                                    ? 'Usuários SEPOD têm acesso automático a todos os centros de custo ATITUDE'
                                                    : 'Selecione um ou mais centros de custo que este consultor pode acessar'}
                                            </p>

                                            {costCentersList.length === 0 ? (
                                                <div className="text-center py-4 text-muted-foreground">
                                                    <p>Nenhum centro de custo disponível</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border rounded-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                                                    {costCentersList.map((centro) => {
                                                        const isAtitude = centro.name.toUpperCase().includes('ATITUDE')
                                                        const isDisabled = formData.role === 'SEPOD' && !isAtitude
                                                        
                                                        return (
                                                            <div key={centro.code} className={`flex items-center space-x-3 p-2 rounded ${isDisabled ? 'opacity-50 bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                                                <Checkbox
                                                                    id={`centro-${centro.code}`}
                                                                    checked={formData.centrosCusto.includes(centro.code)}
                                                                    onCheckedChange={() => handleCentroCustoToggle(centro.code)}
                                                                    disabled={isDisabled}
                                                                    className="border-gray-300 dark:border-gray-600"
                                                                />
                                                                <Label
                                                                    htmlFor={`centro-${centro.code}`}
                                                                    className={`flex-1 cursor-pointer font-normal dark:text-gray-100 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                                >
                                                                    <div className="font-mono text-sm">{centro.code}</div>
                                                                    <div className="text-xs dark:text-gray-400">
                                                                        {centro.name}
                                                                        {isAtitude && formData.role === 'SEPOD' && (
                                                                            <Badge variant="outline" className="ml-2 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                                                ATITUDE
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </Label>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}

                                            {formData.centrosCusto.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <span className="text-xs dark:text-gray-400">Selecionados: </span>
                                                    {formData.centrosCusto.map(cc => {
                                                        const centerName = getCostCenterName(cc)
                                                        const isAtitude = centerName.toUpperCase().includes('ATITUDE')
                                                        return (
                                                            <Badge
                                                                key={cc}
                                                                variant="secondary"
                                                                className={`text-xs ${isAtitude ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                                                            >
                                                                {cc}
                                                                {formData.role === 'SEPOD' && ' (ATITUDE)'}
                                                                {formData.role === 'CONSULTOR' && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleCentroCustoToggle(cc)}
                                                                        className="ml-1 hover:text-red-500 dark:hover:text-red-400"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                )}
                                                            </Badge>
                                                        )
                                                    })}
                                                </div>
                                            )}

                                            {formData.role === 'SEPOD' && (
                                                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                                                    ✅ Usuário SEPOD configurado com acesso a todos os centros de custo ATITUDE
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {shouldShowCentrosCusto && formData.centrosCusto.length === 0 && (
                                        <p className="text-xs text-red-500">
                                            ⚠️ Selecione pelo menos um centro de custo
                                        </p>
                                    )}
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
                                <TableHead>Centros de Custo</TableHead>
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
                                        {usuario.role === 'CONSULTOR' || usuario.role === 'SEPOD' ? (
                                            usuario.centrosCusto && usuario.centrosCusto.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {usuario.centrosCusto.map(cc => (
                                                        <Badge key={cc} variant="outline" className={`text-xs ${usuario.role === 'SEPOD' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>
                                                            {cc}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-red-500 text-sm">⚠️ Nenhum definido</span>
                                            )
                                        ) : (
                                            <span className="text-muted-foreground text-sm">—</span>
                                        )}
                                    </TableCell>
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
                                    <TableCell colSpan={7} className="text-center text-muted-foreground">
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