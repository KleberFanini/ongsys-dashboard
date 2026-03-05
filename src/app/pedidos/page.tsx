// ongsys-dashboard/src/app/pedidos/page.tsx
'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Search,
    Eye,
    ChevronLeft,
    ChevronRight,
    Download,
    Filter
} from "lucide-react"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Skeleton } from "@/src/components/ui/skeleton"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/src/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import { formatCurrency } from "@/src/lib/utils"

const PAGE_SIZE = 20

interface Order {
    id: number
    id_pedido: string
    titulo: string
    status_pedido: string
    fornecedor_nome: string
    fornecedor_documento?: string
    requisitante?: string
    data_pedido: string
    tipo_pedido: string
    valor_total: number
    local_entrega?: any
    itens_pedido?: any[]
    logs?: any[]
    descricao_pedido?: string
    justificativa_compra?: string
    fonte_pagadora?: string
    conta_plano_financeiro?: string
}

// Função para obter a cor do status
const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
        'Ordem finalizada': 'border-success/30 text-success',
        'Aguardando aprovação': 'border-warning/30 text-warning',
        'Em andamento': 'border-blue-500/30 text-blue-500',
        'Cancelado': 'border-destructive/30 text-destructive',
        'Rascunho': 'border-muted-foreground/30 text-muted-foreground'
    }
    return colors[status] || 'border-muted-foreground/30 text-muted-foreground'
}

export default function PedidosPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [statusList, setStatusList] = useState<string[]>(['todos'])
    const [tiposList, setTiposList] = useState<string[]>(['todos'])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [status, setStatus] = useState("todos")
    const [tipo, setTipo] = useState("todos")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [exporting, setExporting] = useState(false)
    const [activeTab, setActiveTab] = useState("detalhes")

    // Buscar filtros
    useEffect(() => {
        async function fetchFilters() {
            try {
                const response = await fetch('/api/pedidos/filtros')
                const data = await response.json()
                setStatusList(['todos', ...(data.status || [])])
                setTiposList(['todos', ...(data.tipos || [])])
            } catch (error) {
                console.error('Erro ao buscar filtros:', error)
            }
        }
        fetchFilters()
    }, [])

    // Buscar pedidos
    useEffect(() => {
        async function fetchOrders() {
            setLoading(true)
            try {
                const params = new URLSearchParams()
                if (search) params.append('search', search)
                if (status !== 'todos') params.append('status', status)
                if (tipo !== 'todos') params.append('tipo', tipo)
                params.append('page', page.toString())

                const response = await fetch(`/api/pedidos?${params.toString()}`)
                const data = await response.json()

                setOrders(data.data || [])
                setTotalPages(data.totalPages || 1)
                setTotalItems(data.total || 0)
            } catch (error) {
                console.error('Erro ao buscar pedidos:', error)
            } finally {
                setLoading(false)
            }
        }

        const timer = setTimeout(() => {
            fetchOrders()
        }, 500)

        return () => clearTimeout(timer)
    }, [search, status, tipo, page])

    // Resetar página quando filtros mudam
    useEffect(() => {
        setPage(1)
    }, [search, status, tipo])

    // Função para exportar
    const handleExport = async (exportTipo: 'pagina' | 'filtro' | 'tudo') => {
        setExporting(true)
        try {
            const params = new URLSearchParams()
            if (exportTipo !== 'tudo') {
                if (search) params.append('search', search)
                if (status !== 'todos') params.append('status', status)
                if (tipo !== 'todos') params.append('tipo', tipo)
                if (exportTipo === 'pagina') params.append('page', page.toString())
            }
            params.append('exportTipo', exportTipo)

            const response = await fetch(`/api/pedidos/export?${params.toString()}`)

            if (!response.ok) throw new Error('Erro ao exportar')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `pedidos_${new Date().toISOString().split('T')[0]}_${exportTipo}.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Erro ao exportar:', error)
            alert('Erro ao exportar pedidos. Tente novamente.')
        } finally {
            setExporting(false)
        }
    }

    if (loading && orders.length === 0) {
        return (
            <div className="space-y-4 p-6">
                <Skeleton className="h-8 w-48" />
                <div className="flex gap-3">
                    <Skeleton className="h-10 flex-1 max-w-sm" />
                    <Skeleton className="h-10 w-40" />
                    <Skeleton className="h-10 w-40" />
                    <Skeleton className="h-10 w-32" />
                </div>
                {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-5 animate-fade-in p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
                    <p className="text-muted-foreground">
                        {totalItems.toLocaleString("pt-BR")} pedidos encontrados
                        {totalItems > PAGE_SIZE && (
                            <span className="text-xs ml-2">
                                (mostrando {orders.length} na página {page})
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
                            Página atual ({orders.length} itens)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('filtro')}>
                            <Filter className="w-4 h-4 mr-2" />
                            Filtro atual ({totalItems} itens)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleExport('tudo')}>
                            <Download className="w-4 h-4 mr-2" />
                            Todos os pedidos
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por título, fornecedor ou ID..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        {statusList.map((s) => (
                            <SelectItem key={s} value={s}>
                                {s === 'todos' ? 'Todos os status' : s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        {tiposList.map((t) => (
                            <SelectItem key={t} value={t}>
                                {t === 'todos' ? 'Todos os tipos' : t}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Indicadores de filtros ativos */}
            {(search || status !== 'todos' || tipo !== 'todos') && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                    <span>Filtros ativos:</span>
                    {search && (
                        <Badge variant="secondary" className="gap-1">
                            Busca: "{search}"
                            <button onClick={() => setSearch('')} className="ml-1 hover:text-foreground">×</button>
                        </Badge>
                    )}
                    {status !== 'todos' && (
                        <Badge variant="secondary" className="gap-1">
                            Status: {status}
                            <button onClick={() => setStatus('todos')} className="ml-1 hover:text-foreground">×</button>
                        </Badge>
                    )}
                    {tipo !== 'todos' && (
                        <Badge variant="secondary" className="gap-1">
                            Tipo: {tipo}
                            <button onClick={() => setTipo('todos')} className="ml-1 hover:text-foreground">×</button>
                        </Badge>
                    )}
                </div>
            )}

            {/* Tabela de pedidos */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="text-left p-3 text-muted-foreground font-medium">ID</th>
                                <th className="text-left p-3 text-muted-foreground font-medium">Título</th>
                                <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Fornecedor</th>
                                <th className="text-left p-3 text-muted-foreground font-medium hidden lg:table-cell">Data</th>
                                <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Tipo</th>
                                <th className="text-right p-3 text-muted-foreground font-medium hidden xl:table-cell">Valor</th>
                                <th className="text-center p-3 text-muted-foreground font-medium">Status</th>
                                <th className="text-center p-3 text-muted-foreground font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order, index) => (
                                <motion.tr
                                    key={order.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                                >
                                    <td className="p-3 font-mono text-xs text-card-foreground">
                                        {order.id_pedido}
                                    </td>
                                    <td className="p-3 text-card-foreground font-medium max-w-[200px] truncate">
                                        {order.titulo}
                                    </td>
                                    <td className="p-3 hidden md:table-cell text-card-foreground">
                                        {order.fornecedor_nome || '---'}
                                    </td>
                                    <td className="p-3 hidden lg:table-cell text-muted-foreground">
                                        {order.data_pedido ? new Date(order.data_pedido).toLocaleDateString("pt-BR") : '---'}
                                    </td>
                                    <td className="p-3 hidden sm:table-cell">
                                        <Badge variant="outline" className="text-xs">
                                            {order.tipo_pedido || '---'}
                                        </Badge>
                                    </td>
                                    <td className="p-3 text-right hidden xl:table-cell text-card-foreground font-medium">
                                        {formatCurrency(order.valor_total || 0)}
                                    </td>
                                    <td className="p-3 text-center">
                                        <Badge
                                            variant="outline"
                                            className={getStatusColor(order.status_pedido || '')}
                                        >
                                            {order.status_pedido || '---'}
                                        </Badge>
                                    </td>
                                    <td className="p-3 text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedOrder(order)
                                                setActiveTab("detalhes")
                                            }}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </motion.tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                        Nenhum pedido encontrado com os filtros selecionados
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
                            <>Mostrando {((page - 1) * PAGE_SIZE) + 1} - {Math.min(page * PAGE_SIZE, totalItems)} de {totalItems} pedidos</>
                        ) : (
                            'Nenhum pedido encontrado'
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

            {/* Modal de detalhes - CORRIGIDO */}
            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            Detalhes do Pedido #{selectedOrder?.id_pedido}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedOrder && (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                                <TabsTrigger value="itens">Itens</TabsTrigger>
                                <TabsTrigger value="entrega">Entrega</TabsTrigger>
                            </TabsList>

                            <TabsContent value="detalhes" className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">ID do Pedido</p>
                                        <p className="text-sm font-medium">{selectedOrder.id_pedido}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Status</p>
                                        <Badge
                                            variant="outline"
                                            className={getStatusColor(selectedOrder.status_pedido || '')}
                                        >
                                            {selectedOrder.status_pedido}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Título</p>
                                    <p className="text-sm">{selectedOrder.titulo}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Fornecedor</p>
                                        <p className="text-sm font-medium">{selectedOrder.fornecedor_nome}</p>
                                        {selectedOrder.fornecedor_documento && (
                                            <p className="text-xs text-muted-foreground">
                                                Doc: {selectedOrder.fornecedor_documento}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Requisitante</p>
                                        <p className="text-sm">{selectedOrder.requisitante || '---'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Data do Pedido</p>
                                        <p className="text-sm">
                                            {selectedOrder.data_pedido
                                                ? new Date(selectedOrder.data_pedido).toLocaleDateString("pt-BR")
                                                : '---'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Valor Total</p>
                                        <p className="text-sm font-bold text-primary">
                                            {formatCurrency(selectedOrder.valor_total || 0)}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Tipo</p>
                                        <p className="text-sm">{selectedOrder.tipo_pedido || '---'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Fonte Pagadora</p>
                                        <p className="text-sm">{selectedOrder.fonte_pagadora || '---'}</p>
                                    </div>
                                </div>

                                {selectedOrder.descricao_pedido && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Descrição</p>
                                        <p className="text-sm bg-muted/30 p-3 rounded-md">
                                            {selectedOrder.descricao_pedido}
                                        </p>
                                    </div>
                                )}

                                {selectedOrder.justificativa_compra && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Justificativa</p>
                                        <p className="text-sm bg-muted/30 p-3 rounded-md">
                                            {selectedOrder.justificativa_compra}
                                        </p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="itens" className="space-y-4 mt-4">
                                {selectedOrder.itens_pedido && selectedOrder.itens_pedido.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedOrder.itens_pedido.map((item, index) => (
                                            <div key={index} className="bg-muted/30 p-3 rounded-lg">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="font-medium">{item.nomeServico}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Grupo: {item.grupo}
                                                        </p>
                                                        {item.descricao && (
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {item.descricao}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Badge variant="outline">
                                                        Qtd: {item.quantidade}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Centro de Custo: {item.centroCusto}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-4">
                                        Nenhum item encontrado
                                    </p>
                                )}
                            </TabsContent>

                            <TabsContent value="entrega" className="space-y-4 mt-4">
                                {selectedOrder.local_entrega ? (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground">Responsável</p>
                                                <p className="text-sm">{selectedOrder.local_entrega.responsavel}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground">CEP</p>
                                                <p className="text-sm">{selectedOrder.local_entrega.cep}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">Endereço</p>
                                            <p className="text-sm">
                                                {selectedOrder.local_entrega.endereco}, {selectedOrder.local_entrega.numero}
                                                {selectedOrder.local_entrega.complemento && ` - ${selectedOrder.local_entrega.complemento}`}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground">Bairro</p>
                                                <p className="text-sm">{selectedOrder.local_entrega.bairro}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground">Cidade/UF</p>
                                                <p className="text-sm">
                                                    {selectedOrder.local_entrega.cidade}/{selectedOrder.local_entrega.estado}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-4">
                                        Nenhuma informação de entrega
                                    </p>
                                )}
                            </TabsContent>
                        </Tabs>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}