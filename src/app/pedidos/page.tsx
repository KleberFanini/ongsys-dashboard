'use client'

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import {
    Search,
    Eye,
    ChevronLeft,
    ChevronRight,
    Download,
    Filter,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    User,
    Calendar,
    Layers,
    Flag
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
import { ETAPAS, identificarEtapa, agruparLogsPorEtapa, identificarEtapaAtual, calcularMediaTempoEtapa, type EtapaEstatistica } from "@/src/lib/order-types"

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

// Função para obter a cor da ETAPA (incluindo CANCELADO)
const getEtapaColor = (etapa: string): string => {
    const colors: Record<string, string> = {
        'ETAPA 01': 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/30',
        'ETAPA 02': 'border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30',
        'ETAPA 03': 'border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30',
        'ETAPA 04': 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950/30',
        'ETAPA 05': 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950/30',
        'CANCELADO': 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30'
    }
    return colors[etapa] || 'border-gray-500 text-gray-600 bg-gray-50 dark:bg-gray-950/30'
}

// Função para obter ícone baseado na ação do log
const getLogIcon = (acao: string) => {
    if (!acao) return <Clock className="w-4 h-4 text-muted-foreground" />

    const acaoLower = acao.toLowerCase()

    if (acaoLower.includes('criou'))
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />
    if (acaoLower.includes('aprovou'))
        return <CheckCircle2 className="w-4 h-4 text-success" />
    if (acaoLower.includes('enviou'))
        return <Clock className="w-4 h-4 text-warning" />
    if (acaoLower.includes('cancel'))
        return <XCircle className="w-4 h-4 text-destructive" />
    if (acaoLower.includes('finaliz'))
        return <CheckCircle2 className="w-4 h-4 text-success" />
    if (acaoLower.includes('gerou'))
        return <AlertCircle className="w-4 h-4 text-blue-500" />
    if (acaoLower.includes('marcou'))
        return <Clock className="w-4 h-4 text-warning" />
    if (acaoLower.includes('encerrou'))
        return <CheckCircle2 className="w-4 h-4 text-success" />
    if (acaoLower.includes('negado') || acaoLower.includes('recusado'))
        return <XCircle className="w-4 h-4 text-destructive" />

    return <Clock className="w-4 h-4 text-muted-foreground" />
}

export default function PedidosPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [statusList, setStatusList] = useState<string[]>(['todos'])
    const [tiposList, setTiposList] = useState<string[]>(['todos'])
    const [etapasList, setEtapasList] = useState<EtapaEstatistica[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [status, setStatus] = useState("todos")
    const [tipo, setTipo] = useState("todos")
    const [etapa, setEtapa] = useState("Todas")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [exporting, setExporting] = useState(false)
    const [activeTab, setActiveTab] = useState("detalhes")
    const [timelineFilter, setTimelineFilter] = useState<'todos' | 'etapas'>('todos')
    const [allOrders, setAllOrders] = useState<Order[]>([])
    const [updateTrigger, setUpdateTrigger] = useState(0)

    // Buscar TODOS os pedidos uma única vez
    useEffect(() => {
        async function fetchAllOrders() {
            try {
                const response = await fetch('/api/pedidos?page=1&limit=10000')
                const data = await response.json()
                setAllOrders(data.data || [])
            } catch (error) {
                console.error('Erro ao buscar todos os pedidos:', error)
            }
        }
        fetchAllOrders()
    }, [])

    // Efeito para atualizar as médias a cada minuto
    useEffect(() => {
        console.log('🔄 Iniciando atualização automática das médias')
        const interval = setInterval(() => {
            setUpdateTrigger(prev => {
                const novo = prev + 1
                console.log('🔄 Atualizando médias...', new Date().toLocaleTimeString(), 'trigger:', novo)
                return novo
            })
        }, 10000) // 10 segundos para teste

        return () => {
            console.log('🛑 Parando atualização automática')
            clearInterval(interval)
        }
    }, [])

    // Função para calcular médias usando TODOS os pedidos
    const mediasGlobais = useMemo(() => {
        if (!allOrders || allOrders.length === 0) {
            console.log('⏳ Aguardando allOrders...')
            return {}
        }

        console.log('📊 Recalculando médias com', allOrders.length, 'pedidos - trigger:', updateTrigger)
        const startTime = Date.now()

        const medias: Record<string, string> = {}
        ETAPAS.forEach(etapa => {
            medias[etapa.nome] = calcularMediaTempoEtapa(allOrders, etapa.nome)
        })

        const endTime = Date.now()
        console.log('✅ Médias recalculadas em', (endTime - startTime) / 1000, 'segundos')

        return medias
    }, [allOrders, updateTrigger])

    // Buscar filtros e estatísticas de etapas
    useEffect(() => {
        async function fetchFilters() {
            try {
                const [filtersRes, etapasRes] = await Promise.all([
                    fetch('/api/pedidos/filtros'),
                    fetch('/api/pedidos/por-etapa')
                ])

                const filtersData = await filtersRes.json()
                const etapasData = await etapasRes.json()

                setStatusList(['todos', ...(filtersData.status || [])])
                setTiposList(['todos', ...(filtersData.tipos || [])])
                setEtapasList(etapasData.estatisticas || [])
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
                let url = ''
                if (etapa !== 'Todas') {
                    // Buscar por etapa específica
                    url = `/api/pedidos/por-etapa?etapa=${encodeURIComponent(etapa)}`
                    const response = await fetch(url)
                    const data = await response.json()
                    setOrders(data.pedidos || [])
                    setTotalItems(data.total || 0)
                    setTotalPages(Math.ceil((data.total || 0) / PAGE_SIZE))
                } else {
                    // Buscar normal com filtros
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
                }
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
    }, [search, status, tipo, etapa, page])

    // Resetar página quando filtros mudam
    useEffect(() => {
        setPage(1)
    }, [search, status, tipo, etapa])

    // Função para exportar
    const handleExport = async (exportTipo: 'pagina' | 'filtro' | 'tudo') => {
        setExporting(true)
        try {
            const params = new URLSearchParams()
            if (exportTipo !== 'tudo') {
                if (search) params.append('search', search)
                if (status !== 'todos') params.append('status', status)
                if (tipo !== 'todos') params.append('tipo', tipo)
                if (etapa !== 'Todas') params.append('etapa', etapa)
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

    // Função para identificar a etapa atual de um pedido (para exibição na tabela)
    const getEtapaAtualDoPedido = (order: Order): string | null => {
        if (!order.logs) return null

        const logsArray = Array.isArray(order.logs) ? order.logs : [order.logs]

        // Verificar cancelamento primeiro
        for (const log of logsArray) {
            const acao = log.acao?.toLowerCase() || ''
            if (acao.includes('cancel') || acao.includes('negado') || acao.includes('recusado')) {
                return 'CANCELADO'
            }
        }

        // Se não cancelado, encontrar a última etapa (da mais avançada para a primeira)
        const etapasOrdem = ['ETAPA 05', 'ETAPA 04', 'ETAPA 03', 'ETAPA 02', 'ETAPA 01']
        for (const etapaNome of etapasOrdem) {
            const etapa = ETAPAS.find(e => e.nome === etapaNome)
            if (!etapa) continue

            for (const log of logsArray) {
                const acao = log.acao?.toLowerCase() || ''
                if (etapa.palavrasChave.some(p => acao.includes(p.toLowerCase()))) {
                    return etapaNome
                }
            }
        }

        return null
    }

    if (loading && orders.length === 0) {
        return (
            <div className="space-y-4 p-6">
                <Skeleton className="h-8 w-48" />
                <div className="flex gap-3">
                    <Skeleton className="h-10 flex-1 max-w-sm" />
                    <Skeleton className="h-10 w-40" />
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
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
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

                {/* Filtro de Etapas */}
                <Select value={etapa} onValueChange={setEtapa}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Etapa" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Todas">Todas as Etapas</SelectItem>
                        {etapasList
                            .sort((a, b) => a.ordem - b.ordem)
                            .map((e) => (
                                <SelectItem key={e.nome} value={e.nome}>
                                    <div className="flex items-center gap-2">
                                        {e.nome === 'CANCELADO' ? (
                                            <XCircle className="w-3 h-3 text-destructive" />
                                        ) : (
                                            <Flag className="w-3 h-3" />
                                        )}
                                        <span>{e.nome} ({e.quantidade})</span>
                                    </div>
                                </SelectItem>
                            ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Cards de Estatísticas de Etapas */}
            {etapasList.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {etapasList
                        .sort((a, b) => a.ordem - b.ordem)
                        .map((etapaItem) => {
                            const isFinal = etapaItem.nome === 'ETAPA 05' || etapaItem.nome === 'CANCELADO'

                            return (
                                <motion.button
                                    key={etapaItem.nome}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setEtapa(etapaItem.nome)}
                                    className={`rounded-lg border p-3 text-left transition-all ${etapa === etapaItem.nome
                                        ? getEtapaColor(etapaItem.nome) + ' border-2'
                                        : 'bg-card border-border hover:border-primary/50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        {etapaItem.nome === 'CANCELADO' ? (
                                            <XCircle className="w-4 h-4 text-red-500" />
                                        ) : (
                                            <Flag className="w-4 h-4" />
                                        )}
                                        <Badge variant="outline" className="text-xs">
                                            {etapaItem.quantidade}
                                        </Badge>
                                    </div>

                                    <p className="text-sm font-medium">
                                        {etapaItem.nome}
                                    </p>

                                    <p className="text-xs opacity-80 mt-1 line-clamp-2">
                                        {etapaItem.descricao}
                                    </p>

                                    {/* Mostrar tempo médio apenas para etapas não finais */}
                                    {!isFinal && mediasGlobais[etapaItem.nome] && mediasGlobais[etapaItem.nome] !== '-' && (
                                        <div className="mt-2 pt-2 border-t border-border/50">
                                            <div className="flex items-center justify-between text-[10px]">
                                                <span className="text-muted-foreground">Tempo médio:</span>
                                                <span className="font-mono font-medium">
                                                    {mediasGlobais[etapaItem.nome]}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Para etapas finais, mostrar mensagem */}
                                    {isFinal && (
                                        <div className="mt-2 pt-2 border-t border-border/50">
                                            <p className="text-[10px] text-muted-foreground text-center">
                                                {etapaItem.nome === 'CANCELADO'
                                                    ? 'Pedidos cancelados'
                                                    : 'Etapa final'}
                                            </p>
                                        </div>
                                    )}
                                </motion.button>
                            )
                        })}
                </div>
            )}
            {/* Indicadores de filtros ativos */}
            {(search || status !== 'todos' || tipo !== 'todos' || etapa !== 'Todas') && (
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
                    {etapa !== 'Todas' && (
                        <Badge variant="secondary" className="gap-1">
                            Etapa: {etapa}
                            <button onClick={() => setEtapa('Todas')} className="ml-1 hover:text-foreground">×</button>
                        </Badge>
                    )}
                </div>
            )}

            {/* Tabela de pedidos - ATUALIZADA com coluna de Etapa Atual */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="text-left p-3 text-muted-foreground font-medium">ID</th>
                                <th className="text-left p-3 text-muted-foreground font-medium">Título</th>
                                <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Fornecedor</th>
                                <th className="text-left p-3 text-muted-foreground font-medium hidden lg:table-cell">Data</th>
                                <th className="text-right p-3 text-muted-foreground font-medium hidden xl:table-cell">Valor</th>
                                <th className="text-center p-3 text-muted-foreground font-medium">Status</th>
                                <th className="text-center p-3 text-muted-foreground font-medium hidden lg:table-cell">Etapa Atual</th>
                                <th className="text-center p-3 text-muted-foreground font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order, index) => {
                                const etapaAtual = getEtapaAtualDoPedido(order)
                                return (
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
                                        <td className="p-3 text-center hidden lg:table-cell">
                                            {etapaAtual ? (
                                                <Badge
                                                    variant="outline"
                                                    className={getEtapaColor(etapaAtual)}
                                                >
                                                    {etapaAtual}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">---</Badge>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedOrder(order)
                                                    setActiveTab("detalhes")
                                                    setTimelineFilter('todos')
                                                }}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </motion.tr>
                                )
                            })}
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

            {/* Modal de detalhes - mantido igual, já usa as funções atualizadas */}
            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            Detalhes do Pedido #{selectedOrder?.id_pedido}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedOrder && (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                                <TabsTrigger value="itens">Itens</TabsTrigger>
                                <TabsTrigger value="entrega">Entrega</TabsTrigger>
                                <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
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

                            {/* TIMELINE COM ETAPAS */}
                            <TabsContent value="timeline" className="space-y-4 mt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-medium text-foreground">Histórico do Pedido</h4>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant={timelineFilter === 'todos' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setTimelineFilter('todos')}
                                            className="h-8"
                                        >
                                            <Layers className="w-3 h-3 mr-1" />
                                            Todos
                                        </Button>
                                        <Button
                                            variant={timelineFilter === 'etapas' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setTimelineFilter('etapas')}
                                            className="h-8"
                                        >
                                            <Flag className="w-3 h-3 mr-1" />
                                            Por Etapas
                                        </Button>
                                    </div>
                                </div>

                                {selectedOrder.logs ? (
                                    (() => {
                                        const logsArray = Array.isArray(selectedOrder.logs)
                                            ? selectedOrder.logs
                                            : [selectedOrder.logs]

                                        if (logsArray.length === 0) {
                                            return (
                                                <div className="text-center py-8">
                                                    <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                                                    <p className="text-sm text-muted-foreground">
                                                        Nenhum log encontrado para este pedido
                                                    </p>
                                                </div>
                                            )
                                        }

                                        if (timelineFilter === 'etapas') {
                                            // Agrupar logs por etapa
                                            const grupos = agruparLogsPorEtapa(logsArray)

                                            return (
                                                <div className="space-y-6">
                                                    {ETAPAS.sort((a, b) => a.ordem - b.ordem).map((etapaInfo) => {
                                                        const logsDaEtapa = grupos[etapaInfo.nome] || []

                                                        if (logsDaEtapa.length === 0) return null

                                                        return (
                                                            <div key={etapaInfo.nome} className="space-y-2">
                                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getEtapaColor(etapaInfo.nome)}`}>
                                                                    {etapaInfo.nome === 'CANCELADO' ? (
                                                                        <XCircle className="w-3 h-3" />
                                                                    ) : (
                                                                        <Flag className="w-3 h-3" />
                                                                    )}
                                                                    <span className="text-xs font-medium">{etapaInfo.nome}</span>
                                                                    <Badge variant="outline" className="text-[10px] px-1">
                                                                        {etapaInfo.descricao}
                                                                    </Badge>
                                                                </div>

                                                                <div className="space-y-2 pl-4">
                                                                    {logsDaEtapa.map((log, index) => (
                                                                        <div key={index} className="bg-muted/30 rounded-lg p-3 ml-4 border-l-2 border-primary/30">
                                                                            <div className="flex items-start justify-between">
                                                                                <p className="text-sm font-medium">{log.acao}</p>
                                                                                <Badge variant="outline" className="text-[10px]">
                                                                                    {new Date(log.data).toLocaleDateString("pt-BR")}
                                                                                </Badge>
                                                                            </div>
                                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                                {log.autor}
                                                                            </p>
                                                                            {log.comentarios && (
                                                                                <p className="text-xs text-muted-foreground mt-1 italic">
                                                                                    "{log.comentarios}"
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )
                                        } else {
                                            // Visualização normal (todos os logs em ordem cronológica)
                                            return (
                                                <div className="relative">
                                                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                                                    <div className="space-y-4">
                                                        {logsArray.map((log: any, index: number) => (
                                                            <motion.div
                                                                key={index}
                                                                initial={{ opacity: 0, x: -20 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: index * 0.05 }}
                                                                className="relative flex gap-4 pl-10"
                                                            >
                                                                <div className="absolute left-0 w-8 h-8 rounded-full bg-card border-2 border-border flex items-center justify-center">
                                                                    {getLogIcon(log.acao || '')}
                                                                </div>

                                                                <div className="flex-1 bg-muted/30 rounded-lg p-3">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <p className="text-sm font-medium text-card-foreground">
                                                                            {log.acao || 'Ação desconhecida'}
                                                                        </p>
                                                                        <Badge variant="outline" className="text-[10px]">
                                                                            <Calendar className="w-3 h-3 mr-1" />
                                                                            {log.data ? new Date(log.data).toLocaleDateString("pt-BR") : '---'}
                                                                        </Badge>
                                                                    </div>

                                                                    <div className="flex items-center text-xs text-muted-foreground">
                                                                        <User className="w-3 h-3 mr-1" />
                                                                        {log.autor || 'Autor não informado'}
                                                                    </div>

                                                                    {log.comentarios && (
                                                                        <p className="text-xs text-muted-foreground mt-2 italic">
                                                                            "{log.comentarios}"
                                                                        </p>
                                                                    )}

                                                                    {log.data && (
                                                                        <p className="text-[10px] text-muted-foreground mt-2">
                                                                            {new Date(log.data).toLocaleTimeString("pt-BR")}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        }
                                    })()
                                ) : (
                                    <div className="text-center py-8">
                                        <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                                        <p className="text-sm text-muted-foreground">
                                            Nenhum log encontrado para este pedido
                                        </p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}