// src/app/(dashboard)/pedidos/page.tsx
'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
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
    Flag,
    Loader2
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
import { ETAPAS, agruparLogsPorEtapa, identificarEtapaAtual, type EtapaEstatistica } from "@/src/lib/order-types"
import { useAuth } from "@/src/hooks/useAuth"

const PAGE_SIZE = 20
const BATCH_SIZE = 3
const CACHE_KEY = 'pedidos_completo_cache'
const CACHE_DURATION = 10 * 60 * 1000

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

interface CacheData {
    allOrders: Order[]
    totalItems: number
    totalPages: number
    timestamp: number
}

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

const getLogIcon = (acao: string) => {
    if (!acao) return <Clock className="w-4 h-4 text-muted-foreground" />
    const acaoLower = acao.toLowerCase()
    if (acaoLower.includes('criou')) return <CheckCircle2 className="w-4 h-4 text-blue-500" />
    if (acaoLower.includes('aprovou')) return <CheckCircle2 className="w-4 h-4 text-success" />
    if (acaoLower.includes('enviou')) return <Clock className="w-4 h-4 text-warning" />
    if (acaoLower.includes('cancel')) return <XCircle className="w-4 h-4 text-destructive" />
    if (acaoLower.includes('finaliz')) return <CheckCircle2 className="w-4 h-4 text-success" />
    if (acaoLower.includes('gerou')) return <AlertCircle className="w-4 h-4 text-blue-500" />
    if (acaoLower.includes('marcou')) return <Clock className="w-4 h-4 text-warning" />
    if (acaoLower.includes('encerrou')) return <CheckCircle2 className="w-4 h-4 text-success" />
    if (acaoLower.includes('negado') || acaoLower.includes('recusado')) return <XCircle className="w-4 h-4 text-destructive" />
    return <Clock className="w-4 h-4 text-muted-foreground" />
}

export default function PedidosPage() {
    const { isLoading: authLoading, isAuthenticated } = useAuth()
    const [allOrders, setAllOrders] = useState<Order[]>([])
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 })
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
    const abortControllerRef = useRef<AbortController | null>(null)
    const [hasLoaded, setHasLoaded] = useState(false)

    // Calcular estatísticas de etapas baseado nos pedidos carregados
    const etapasEstatisticas = useMemo(() => {
        if (allOrders.length === 0) return []

        const estatisticas: EtapaEstatistica[] = ETAPAS.map(etapa => ({
            nome: etapa.nome,
            descricao: etapa.descricao,
            quantidade: 0,
            ordem: etapa.ordem
        }))

        allOrders.forEach(order => {
            const etapaAtual = identificarEtapaAtual(order.logs || [])
            if (etapaAtual) {
                const etapaInfo = estatisticas.find(e => e.nome === etapaAtual)
                if (etapaInfo) {
                    etapaInfo.quantidade++
                }
            }
        })

        return estatisticas
    }, [allOrders])

    // Extrair status e tipos únicos
    const uniqueStatus = useMemo(() => {
        const statusSet = new Set<string>()
        allOrders.forEach(order => {
            if (order.status_pedido) statusSet.add(order.status_pedido)
        })
        return ['todos', ...Array.from(statusSet)]
    }, [allOrders])

    const uniqueTipos = useMemo(() => {
        const tipoSet = new Set<string>()
        allOrders.forEach(order => {
            if (order.tipo_pedido) tipoSet.add(order.tipo_pedido)
        })
        return ['todos', ...Array.from(tipoSet)]
    }, [allOrders])

    // Aplicar filtros localmente
    useEffect(() => {
        if (allOrders.length === 0) return

        let filtered = [...allOrders]

        if (search) {
            const searchLower = search.toLowerCase()
            filtered = filtered.filter(order =>
                order.titulo?.toLowerCase().includes(searchLower) ||
                order.id_pedido?.toLowerCase().includes(searchLower) ||
                order.fornecedor_nome?.toLowerCase().includes(searchLower)
            )
        }

        if (status !== 'todos') {
            filtered = filtered.filter(order => order.status_pedido === status)
        }

        if (tipo !== 'todos') {
            filtered = filtered.filter(order => order.tipo_pedido === tipo)
        }

        if (etapa !== 'Todas') {
            filtered = filtered.filter(order => {
                const etapaAtual = identificarEtapaAtual(order.logs || [])
                return etapaAtual === etapa
            })
        }

        setFilteredOrders(filtered)
        setTotalItems(filtered.length)
        setTotalPages(Math.ceil(filtered.length / PAGE_SIZE))
        setPage(1)
    }, [allOrders, search, status, tipo, etapa])

    // Carregar todas as páginas em lotes
    const loadAllPages = useCallback(async () => {
        // Verificar cache primeiro
        try {
            const cached = localStorage.getItem(CACHE_KEY)
            if (cached) {
                const data: CacheData = JSON.parse(cached)
                if (Date.now() - data.timestamp < CACHE_DURATION) {
                    console.log('📦 Usando cache com', data.allOrders.length, 'pedidos')
                    setAllOrders(data.allOrders)
                    setTotalItems(data.totalItems)
                    setTotalPages(data.totalPages)
                    setLoading(false)
                    setHasLoaded(true)
                    return
                }
            }
        } catch (e) {
            console.warn('Erro ao ler cache:', e)
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        const controller = new AbortController()
        abortControllerRef.current = controller

        setLoading(true)
        setHasLoaded(false)

        try {
            const primeiraRes = await fetch('/api/pedidos?page=1', { signal: controller.signal })

            if (!primeiraRes.ok) {
                throw new Error(`HTTP ${primeiraRes.status}`)
            }

            const primeiraData = await primeiraRes.json()
            const totalPedidos = primeiraData.total || 0
            const totalPaginas = Math.ceil(totalPedidos / 100)

            console.log(`📊 Total de pedidos: ${totalPedidos} (${totalPaginas} páginas)`)

            const pedidosComValor = (primeiraData.data || []).map((order: any) => ({
                ...order,
                valor_total: order.itens_pedido?.reduce((acc: number, item: any) => {
                    const quantidade = parseFloat(item.quantidade) || 0
                    const valorUnitario = parseFloat(item.valorUnitario) || 0
                    return acc + (quantidade * valorUnitario)
                }, 0) || 0
            }))

            let allData = [...pedidosComValor]
            setLoadingProgress({ current: 1, total: totalPaginas })

            if (totalPaginas > 1) {
                const paginasRestantes = []
                for (let p = 2; p <= totalPaginas; p++) {
                    paginasRestantes.push(p)
                }

                for (let i = 0; i < paginasRestantes.length; i += BATCH_SIZE) {
                    const batch = paginasRestantes.slice(i, i + BATCH_SIZE)
                    console.log(`📄 Carregando lote ${Math.floor(i / BATCH_SIZE) + 1}: páginas ${batch.join(', ')}`)

                    const promises = batch.map(p =>
                        fetch(`/api/pedidos?page=${p}`, { signal: controller.signal })
                            .then(res => res.json())
                            .catch(err => ({ error: err, page: p }))
                    )

                    const results = await Promise.all(promises)

                    results.forEach((result, idx) => {
                        if (result.error) {
                            console.warn(`⚠️ Erro na página ${batch[idx]}:`, result.error)
                        } else if (result.data) {
                            const pedidos = (result.data || []).map((order: any) => ({
                                ...order,
                                valor_total: order.itens_pedido?.reduce((acc: number, item: any) => {
                                    const quantidade = parseFloat(item.quantidade) || 0
                                    const valorUnitario = parseFloat(item.valorUnitario) || 0
                                    return acc + (quantidade * valorUnitario)
                                }, 0) || 0
                            }))
                            allData.push(...pedidos)
                        }
                    })

                    setLoadingProgress({ current: Math.min(i + BATCH_SIZE + 1, totalPaginas), total: totalPaginas })

                    if (i + BATCH_SIZE < paginasRestantes.length) {
                        await new Promise(resolve => setTimeout(resolve, 500))
                    }
                }
            }

            console.log(`✅ ${allData.length} pedidos carregados`)
            setAllOrders(allData)
            setTotalItems(totalPedidos)
            setTotalPages(Math.ceil(totalPedidos / PAGE_SIZE))

            try {
                const cacheData: CacheData = {
                    allOrders: allData,
                    totalItems: totalPedidos,
                    totalPages: Math.ceil(totalPedidos / PAGE_SIZE),
                    timestamp: Date.now()
                }
                localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
            } catch (e) {
                console.warn('Erro ao salvar cache:', e)
            }

        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Erro ao carregar pedidos:', error)
                setAllOrders([])
                setTotalItems(0)
                setTotalPages(1)
            }
        } finally {
            setLoading(false)
            setHasLoaded(true)
            setLoadingProgress({ current: 0, total: 0 })
        }
    }, [])

    // Carregar dados apenas quando autenticado e não carregou ainda
    useEffect(() => {
        if (isAuthenticated && !hasLoaded) {
            console.log('🚀 Iniciando carregamento dos pedidos...')
            loadAllPages()
        }
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [isAuthenticated, hasLoaded, loadAllPages])

    // Paginação local
    const paginatedOrders = filteredOrders.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    )

    const handleExport = async (exportTipo: 'pagina' | 'filtro' | 'tudo') => {
        setExporting(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1000))
            const dadosExportar = exportTipo === 'pagina' ? paginatedOrders : filteredOrders
            alert(`Exportação simulada! ${dadosExportar.length} itens.`)
        } catch (error) {
            console.error('Erro ao exportar:', error)
            alert('Erro ao exportar pedidos. Tente novamente.')
        } finally {
            setExporting(false)
        }
    }

    // Mostrar loading da autenticação
    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    // Mostrar loading com progresso enquanto carrega todas as páginas
    if (loading || allOrders.length === 0) {
        return (
            <div className="space-y-4 p-6">
                <Skeleton className="h-8 w-48" />
                <div className="flex gap-3">
                    <Skeleton className="h-10 flex-1 max-w-sm" />
                    <Skeleton className="h-10 w-40" />
                    <Skeleton className="h-10 w-40" />
                    <Skeleton className="h-10 w-40" />
                </div>
                <div className="bg-card rounded-xl border border-border p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Carregando todos os pedidos...</p>
                    {loadingProgress.total > 0 && (
                        <div className="mt-4">
                            <div className="w-full bg-muted rounded-full h-2">
                                <div
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Carregando página {loadingProgress.current} de {loadingProgress.total}
                            </p>
                        </div>
                    )}
                </div>
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        )
    }

    // Dados carregados, mostrar tabela completa
    return (
        <div className="space-y-5 animate-fade-in p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
                    <p className="text-muted-foreground">
                        {totalItems.toLocaleString("pt-BR")} pedidos encontrados
                        {totalItems > PAGE_SIZE && (
                            <span className="text-xs ml-2">
                                (mostrando {paginatedOrders.length} na página {page})
                            </span>
                        )}
                    </p>
                </div>

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
                            Página atual ({paginatedOrders.length} itens)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('filtro')}>
                            <Filter className="w-4 h-4 mr-2" />
                            Filtro atual ({totalItems} itens)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleExport('tudo')}>
                            <Download className="w-4 h-4 mr-2" />
                            Todos os pedidos ({allOrders.length} itens)
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
                        {uniqueStatus.map((s) => (
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
                        {uniqueTipos.map((t) => (
                            <SelectItem key={t} value={t}>
                                {t === 'todos' ? 'Todos os tipos' : t}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={etapa} onValueChange={setEtapa}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Etapa" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Todas">Todas as Etapas</SelectItem>
                        {etapasEstatisticas
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
            {etapasEstatisticas.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {etapasEstatisticas
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
                                    <p className="text-sm font-medium">{etapaItem.nome}</p>
                                    <p className="text-xs opacity-80 mt-1 line-clamp-2">{etapaItem.descricao}</p>
                                    {isFinal && (
                                        <div className="mt-2 pt-2 border-t border-border/50">
                                            <p className="text-[10px] text-muted-foreground text-center">
                                                {etapaItem.nome === 'CANCELADO' ? 'Pedidos cancelados' : 'Etapa final'}
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
                                <th className="text-right p-3 text-muted-foreground font-medium hidden xl:table-cell">Valor</th>
                                <th className="text-center p-3 text-muted-foreground font-medium">Status</th>
                                <th className="text-center p-3 text-muted-foreground font-medium hidden lg:table-cell">Etapa Atual</th>
                                <th className="text-center p-3 text-muted-foreground font-medium">Ações</th>
                                \)
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedOrders.map((order, index) => {
                                const etapaAtual = identificarEtapaAtual(order.logs || [])
                                return (
                                    <motion.tr
                                        key={order.id || order.id_pedido}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                                    >
                                        <td className="p-3 font-mono text-xs text-card-foreground">{order.id_pedido}</td>
                                        <td className="p-3 text-card-foreground font-medium max-w-[200px] truncate">{order.titulo}</td>
                                        <td className="p-3 hidden md:table-cell text-card-foreground">{order.fornecedor_nome || '---'}</td>
                                        <td className="p-3 hidden lg:table-cell text-muted-foreground">
                                            {order.data_pedido ? new Date(order.data_pedido).toLocaleDateString("pt-BR") : '---'}
                                        </td>
                                        <td className="p-3 text-right hidden xl:table-cell text-card-foreground font-medium">
                                            {formatCurrency(order.valor_total || 0)}
                                        </td>
                                        <td className="p-3 text-center">
                                            <Badge variant="outline" className={getStatusColor(order.status_pedido || '')}>
                                                {order.status_pedido || '---'}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-center hidden lg:table-cell">
                                            {etapaAtual ? (
                                                <Badge variant="outline" className={getEtapaColor(etapaAtual)}>
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
                            {paginatedOrders.length === 0 && (
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
                {totalPages > 1 && (
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
                )}
            </div>

            {/* Modal de detalhes */}
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
                                    <div><p className="text-xs text-muted-foreground">ID</p><p className="text-sm font-medium">{selectedOrder.id_pedido}</p></div>
                                    <div><p className="text-xs text-muted-foreground">Status</p><Badge variant="outline" className={getStatusColor(selectedOrder.status_pedido || '')}>{selectedOrder.status_pedido}</Badge></div>
                                </div>
                                <div><p className="text-xs text-muted-foreground">Título</p><p className="text-sm">{selectedOrder.titulo}</p></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><p className="text-xs text-muted-foreground">Fornecedor</p><p className="text-sm font-medium">{selectedOrder.fornecedor_nome}</p></div>
                                    <div><p className="text-xs text-muted-foreground">Requisitante</p><p className="text-sm">{selectedOrder.requisitante || '---'}</p></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><p className="text-xs text-muted-foreground">Data</p><p className="text-sm">{selectedOrder.data_pedido ? new Date(selectedOrder.data_pedido).toLocaleDateString("pt-BR") : '---'}</p></div>
                                    <div><p className="text-xs text-muted-foreground">Valor</p><p className="text-sm font-bold text-primary">{formatCurrency(selectedOrder.valor_total || 0)}</p></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><p className="text-xs text-muted-foreground">Tipo</p><p className="text-sm">{selectedOrder.tipo_pedido || '---'}</p></div>
                                    <div><p className="text-xs text-muted-foreground">Fonte Pagadora</p><p className="text-sm">{selectedOrder.fonte_pagadora || '---'}</p></div>
                                </div>
                                {selectedOrder.descricao_pedido && (
                                    <div><p className="text-xs text-muted-foreground">Descrição</p><p className="text-sm bg-muted/30 p-3 rounded-md">{selectedOrder.descricao_pedido}</p></div>
                                )}
                            </TabsContent>

                            <TabsContent value="itens" className="space-y-4 mt-4">
                                {selectedOrder.itens_pedido && selectedOrder.itens_pedido.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedOrder.itens_pedido.map((item, idx) => (
                                            <div key={idx} className="bg-muted/30 p-3 rounded-lg">
                                                <p className="font-medium">{item.nomeServico || item.nomeProduto}</p>
                                                <p className="text-xs text-muted-foreground">Grupo: {item.grupo} | Qtd: {item.quantidade}</p>
                                                <p className="text-xs text-muted-foreground mt-1">Centro de Custo: {item.centroCusto}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-center py-4">Nenhum item encontrado</p>}
                            </TabsContent>

                            <TabsContent value="entrega" className="space-y-4 mt-4">
                                {selectedOrder.local_entrega ? (
                                    <div className="space-y-2">
                                        <p><span className="text-muted-foreground">Responsável:</span> {selectedOrder.local_entrega.responsavel}</p>
                                        <p><span className="text-muted-foreground">Endereço:</span> {selectedOrder.local_entrega.endereco}, {selectedOrder.local_entrega.numero}</p>
                                        <p><span className="text-muted-foreground">Cidade:</span> {selectedOrder.local_entrega.cidade}/{selectedOrder.local_entrega.estado} - CEP: {selectedOrder.local_entrega.cep}</p>
                                    </div>
                                ) : <p className="text-center py-4">Sem informação de entrega</p>}
                            </TabsContent>

                            <TabsContent value="timeline" className="space-y-4 mt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-medium text-foreground">Histórico do Pedido</h4>
                                    <div className="flex items-center gap-2">
                                        <Button variant={timelineFilter === 'todos' ? 'default' : 'outline'} size="sm" onClick={() => setTimelineFilter('todos')} className="h-8">
                                            <Layers className="w-3 h-3 mr-1" />
                                            Todos
                                        </Button>
                                        <Button variant={timelineFilter === 'etapas' ? 'default' : 'outline'} size="sm" onClick={() => setTimelineFilter('etapas')} className="h-8">
                                            <Flag className="w-3 h-3 mr-1" />
                                            Por Etapas
                                        </Button>
                                    </div>
                                </div>
                                {selectedOrder.logs && selectedOrder.logs.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedOrder.logs.map((log, idx) => (
                                            <div key={idx} className="border-l-2 border-primary/30 pl-4 py-2">
                                                <p className="text-sm font-medium">{log.acao}</p>
                                                <p className="text-xs text-muted-foreground">{log.autor} - {new Date(log.data).toLocaleString("pt-BR")}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-center py-4">Nenhum log encontrado</p>}
                            </TabsContent>
                        </Tabs>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}