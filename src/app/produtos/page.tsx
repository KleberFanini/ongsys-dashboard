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
    Clock
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
    preco: number
    status: string
}

// Opções de status para o filtro
const STATUS_OPTIONS = [
    { value: 'Todos', label: 'Todos os status', icon: null },
    { value: 'ativo', label: 'Ativo', icon: CheckCircle, color: 'text-success' },
    { value: 'inativo', label: 'Inativo', icon: XCircle, color: 'text-destructive' },
    { value: 'pendente', label: 'Pendente', icon: Clock, color: 'text-warning' },
]

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
                setTotalItems(data.total)  // SALVA O TOTAL DE ITENS
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

    if (loading && products.length === 0) {
        return (
            <div className="space-y-4 p-6">
                <Skeleton className="h-8 w-48" />
                <div className="flex gap-3">
                    <Skeleton className="h-10 flex-1 max-w-sm" />
                    <Skeleton className="h-10 w-44" />
                    <Skeleton className="h-10 w-40" />
                    <Skeleton className="h-10 w-32" />
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
                            Filtro atual
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

                {/* NOVO: Filtro de status */}
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                                <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Categoria</th>
                                <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Preço</th>
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
                                    <td className="p-3 hidden sm:table-cell text-card-foreground font-medium">
                                        {formatCurrency(product.preco || 0)}
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
                        Página {page} de {totalPages}
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

            {/* Modal de detalhes */}
            <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Produto</DialogTitle>
                    </DialogHeader>
                    {selectedProduct && (
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-border">
                                <span className="text-muted-foreground text-sm">Código</span>
                                <span className="text-card-foreground text-sm font-medium">{selectedProduct.codigo}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-border">
                                <span className="text-muted-foreground text-sm">Nome</span>
                                <span className="text-card-foreground text-sm font-medium">{selectedProduct.nome}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-border">
                                <span className="text-muted-foreground text-sm">Categoria</span>
                                <span className="text-card-foreground text-sm font-medium">{selectedProduct.categoria || 'Não informada'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-border">
                                <span className="text-muted-foreground text-sm">Preço</span>
                                <span className="text-card-foreground text-sm font-medium">{formatCurrency(selectedProduct.preco || 0)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-border">
                                <span className="text-muted-foreground text-sm">Status</span>
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(selectedProduct.status)}
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
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}