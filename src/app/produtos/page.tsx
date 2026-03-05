'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Search,
    Package,
    ChevronLeft,
    ChevronRight,
    Eye,
    Download,
    Filter,
    CheckCircle,
    XCircle,
    Clock,
    Ruler,
    Package2,
    Building2,
    CreditCard,
    FileText
} from "lucide-react"
import { Input } from "@/src/components/ui/input"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Skeleton } from "@/src/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"

const PAGE_SIZE = 20

const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

interface Product {
    id: number
    codigo: string
    nome: string
    categoria: string
    unidadeMedida: string
    status: string
    descricao?: string
    origem?: string
    contaPadrao?: string
    fabricante?: string
}

export default function ProdutosPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [categorias, setCategorias] = useState<string[]>(['Todos'])
    const [statusList, setStatusList] = useState<string[]>(['Todos'])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [categoria, setCategoria] = useState("Todos")
    const [status, setStatus] = useState("Todos")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [exporting, setExporting] = useState(false)

    // Buscar categorias e status
    useEffect(() => {
        async function fetchFilters() {
            try {
                const response = await fetch('/api/produtos/categorias')
                const data = await response.json()
                setCategorias(['Todos', ...data.categorias])
                setStatusList(['Todos', ...data.statusList])
            } catch (error) {
                console.error('Erro ao buscar filtros:', error)
            }
        }
        fetchFilters()
    }, [])

    // Buscar produtos
    useEffect(() => {
        async function fetchProducts() {
            setLoading(true)
            try {
                const params = new URLSearchParams()
                if (search) params.append('search', search)
                if (categoria !== 'Todos') params.append('categoria', categoria)
                if (status !== 'Todos') params.append('status', status)
                params.append('page', page.toString())

                const response = await fetch(`/api/produtos?${params.toString()}`)
                const data = await response.json()

                setProducts(data.data)
                setTotalPages(data.totalPages)
                setTotalItems(data.total)
            } catch (error) {
                console.error('Erro ao buscar produtos:', error)
            } finally {
                setLoading(false)
            }
        }

        const timer = setTimeout(() => {
            fetchProducts()
        }, 500)

        return () => clearTimeout(timer)
    }, [search, categoria, status, page])

    // Resetar página quando filtros mudam
    useEffect(() => {
        setPage(1)
    }, [search, categoria, status])

    // Função para obter o ícone do status
    const getStatusIcon = (statusValue: string) => {
        const option = STATUS_OPTIONS.find(opt => opt.value === statusValue?.toLowerCase())
        if (option?.icon) {
            const Icon = option.icon
            return <Icon className={`w-3 h-3 mr-1 ${option.color}`} />
        }
        return null
    }

    // Função para exportar
    const handleExport = async (tipo: 'filtro' | 'pagina' | 'tudo') => {
        setExporting(true)
        try {
            const params = new URLSearchParams()
            if (tipo !== 'tudo') {
                if (search) params.append('search', search)
                if (categoria !== 'Todos') params.append('categoria', categoria)
                if (status !== 'Todos') params.append('status', status)
                if (tipo === 'pagina') params.append('page', page.toString())
            }
            params.append('tipo', tipo)

            const response = await fetch(`/api/produtos/export?${params.toString()}`)

            if (!response.ok) throw new Error('Erro ao exportar')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `produtos_${new Date().toISOString().split('T')[0]}_${tipo}.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Erro ao exportar:', error)
            alert('Erro ao exportar produtos. Tente novamente.')
        } finally {
            setExporting(false)
        }
    }

    // Opções de status
    const STATUS_OPTIONS = [
        { value: 'Todos', label: 'Todos os status', icon: null },
        { value: 'ativo', label: 'Ativo', icon: CheckCircle, color: 'text-success' },
        { value: 'inativo', label: 'Inativo', icon: XCircle, color: 'text-destructive' },
        { value: 'pendente', label: 'Pendente', icon: Clock, color: 'text-warning' },
    ]

    if (loading && products.length === 0) {
        return (
            <div className="space-y-4 p-6">
                <Skeleton className="h-8 w-48" />
                <div className="flex gap-3">
                    <Skeleton className="h-10 flex-1 max-w-sm" />
                    <Skeleton className="h-10 w-44" />
                    <Skeleton className="h-10 w-40" />
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-5 animate-fade-in p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
                    <p className="text-muted-foreground">
                        {totalItems.toLocaleString("pt-BR")} produtos encontrados
                        {totalItems > PAGE_SIZE && (
                            <span className="text-xs ml-2">
                                (mostrando {products.length} na página {page})
                            </span>
                        )}
                    </p>
                </div>

                {/* Botão de exportação */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" disabled={exporting}>
                            <Download className="w-4 h-4 mr-2" />
                            {exporting ? 'Exportando...' : 'Exportar'}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Opções de Exportação</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleExport('pagina')}>
                            <Filter className="w-4 h-4 mr-2" />
                            Página atual ({products.length} itens)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('filtro')}>
                            <Filter className="w-4 h-4 mr-2" />
                            Filtro atual ({totalItems} itens)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleExport('tudo')}>
                            <Package className="w-4 h-4 mr-2" />
                            Todos os produtos
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar produto por nome ou código..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Filtro de categoria */}
                <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                        {categorias.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Filtro de status */}
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                    {option.icon && <option.icon className={`w-4 h-4 ${option.color || ''}`} />}
                                    <span>{option.label}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Indicadores de filtros ativos */}
            {(search || categoria !== 'Todos' || status !== 'Todos') && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                    <span>Filtros ativos:</span>
                    {search && (
                        <Badge variant="secondary" className="gap-1">
                            Busca: "{search}"
                            <button onClick={() => setSearch('')} className="ml-1 hover:text-foreground">×</button>
                        </Badge>
                    )}
                    {categoria !== 'Todos' && (
                        <Badge variant="secondary" className="gap-1">
                            Categoria: {categoria}
                            <button onClick={() => setCategoria('Todos')} className="ml-1 hover:text-foreground">×</button>
                        </Badge>
                    )}
                    {status !== 'Todos' && (
                        <Badge variant="secondary" className="gap-1">
                            Status: {status}
                            <button onClick={() => setStatus('Todos')} className="ml-1 hover:text-foreground">×</button>
                        </Badge>
                    )}
                </div>
            )}

            {/* Tabela de produtos */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="text-left p-3 text-muted-foreground font-medium">Código</th>
                                <th className="text-left p-3 text-muted-foreground font-medium">Nome</th>
                                <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Grupo</th>
                                <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Unidade</th>
                                <th className="text-left p-3 text-muted-foreground font-medium hidden lg:table-cell">Status</th>
                                <th className="text-center p-3 text-muted-foreground font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product, index) => (
                                <motion.tr
                                    key={product.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                                >
                                    <td className="p-3 font-mono text-xs text-card-foreground">
                                        {product.codigo}
                                    </td>
                                    <td className="p-3 text-card-foreground font-medium">
                                        {product.nome}
                                    </td>
                                    <td className="p-3 hidden md:table-cell">
                                        <Badge variant="outline" className="text-xs">
                                            {product.categoria || 'Sem categoria'}
                                        </Badge>
                                    </td>
                                    <td className="p-3 hidden sm:table-cell">
                                        <div className="flex items-center gap-1">
                                            <Ruler className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-card-foreground">
                                                {product.unidadeMedida || 'Não informada'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3 hidden lg:table-cell">
                                        <div className="flex items-center">
                                            {getStatusIcon(product.status)}
                                            <Badge
                                                variant="outline"
                                                className={
                                                    product.status?.toLowerCase() === 'ativo'
                                                        ? 'border-success/30 text-success'
                                                        : product.status?.toLowerCase() === 'inativo'
                                                            ? 'border-destructive/30 text-destructive'
                                                            : product.status?.toLowerCase() === 'pendente'
                                                                ? 'border-warning/30 text-warning'
                                                                : 'border-muted-foreground/30 text-muted-foreground'
                                                }
                                            >
                                                {product.status || 'Sem status'}
                                            </Badge>
                                        </div>
                                    </td>
                                    <td className="p-3 text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedProduct(product)}
                                            title="Ver detalhes"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </motion.tr>
                            ))}
                            {products.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        Nenhum produto encontrado com os filtros selecionados
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginação */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                        {totalItems > 0 ? (
                            <>Mostrando {((page - 1) * PAGE_SIZE) + 1} - {Math.min(page * PAGE_SIZE, totalItems)} de {totalItems} produtos</>
                        ) : (
                            'Nenhum produto encontrado'
                        )}
                    </p>
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage(page + 1)}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Modal de detalhes - AGORA COM TODOS OS CAMPOS */}
            <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Detalhes do Produto</DialogTitle>
                    </DialogHeader>
                    {selectedProduct && (
                        <div className="space-y-4">
                            {/* Linha 1: Código e Nome */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Package className="w-4 h-4" />
                                        <span>Código</span>
                                    </div>
                                    <p className="text-card-foreground font-mono text-sm font-medium pl-6">
                                        {selectedProduct.codigo}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Package2 className="w-4 h-4" />
                                        <span>Nome</span>
                                    </div>
                                    <p className="text-card-foreground text-sm font-medium pl-6">
                                        {selectedProduct.nome}
                                    </p>
                                </div>
                            </div>

                            {/* Linha 2: Categoria e Status */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Filter className="w-4 h-4" />
                                        <span>Grupo</span>
                                    </div>
                                    <p className="text-card-foreground text-sm font-medium pl-6">
                                        {selectedProduct.categoria || 'Não informada'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        {getStatusIcon(selectedProduct.status)}
                                        <span>Status</span>
                                    </div>
                                    <div className="pl-6">
                                        <Badge
                                            variant="outline"
                                            className={
                                                selectedProduct.status?.toLowerCase() === 'ativo'
                                                    ? 'border-success/30 text-success'
                                                    : selectedProduct.status?.toLowerCase() === 'inativo'
                                                        ? 'border-destructive/30 text-destructive'
                                                        : selectedProduct.status?.toLowerCase() === 'pendente'
                                                            ? 'border-warning/30 text-warning'
                                                            : 'border-muted-foreground/30 text-muted-foreground'
                                            }
                                        >
                                            {selectedProduct.status || 'Não informado'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Linha 3: Unidade de Medida e Fabricante */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Ruler className="w-4 h-4" />
                                        <span>Unidade de Medida</span>
                                    </div>
                                    <p className="text-card-foreground text-sm font-medium pl-6">
                                        {selectedProduct.unidadeMedida || 'Não informada'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Building2 className="w-4 h-4" />
                                        <span>Fabricante</span>
                                    </div>
                                    <p className="text-card-foreground text-sm font-medium pl-6">
                                        {selectedProduct.fabricante || 'Não informado'}
                                    </p>
                                </div>
                            </div>

                            {/* Linha 4: Origem e Conta Padrão */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Package className="w-4 h-4" />
                                        <span>Origem</span>
                                    </div>
                                    <p className="text-card-foreground text-sm font-medium pl-6">
                                        {selectedProduct.origem || 'Não informada'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CreditCard className="w-4 h-4" />
                                        <span>Conta Padrão</span>
                                    </div>
                                    <p className="text-card-foreground text-sm font-medium pl-6">
                                        {selectedProduct.contaPadrao || 'Não informada'}
                                    </p>
                                </div>
                            </div>

                            {/* Linha 5: Descrição (ocupa linha inteira) */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <FileText className="w-4 h-4" />
                                    <span>Descrição</span>
                                </div>
                                <p className="text-card-foreground text-sm pl-6 bg-muted/30 p-3 rounded-md">
                                    {selectedProduct.descricao || 'Sem descrição cadastrada'}
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}