'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Package,
    DollarSign,
    Briefcase,
    TrendingUp,
    Calendar,
    Filter,
    X,
    Award,
    ChevronRight,
    Building2
} from "lucide-react"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from "recharts"
import { StatCard } from "@/src/components/StatCard"
import { Skeleton } from "@/src/components/ui/skeleton"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { DashboardSummary, CostCenter } from "@/src/lib/dashboard-types"
import { costCentersList, getCostCenterName } from '@/src/lib/cost-centers-map'

const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

const formatNumber = (v: number) =>
    new Intl.NumberFormat("pt-BR").format(v)

export default function DashboardPage() {
    const [data, setData] = useState<DashboardSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isDarkMode, setIsDarkMode] = useState(false)

    // Estados para filtros
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [selectedCostCenter, setSelectedCostCenter] = useState('todos')
    const [availableCostCenters, setAvailableCostCenters] = useState<CostCenter[]>([])
    const [showDateFilter, setShowDateFilter] = useState(false)

    const getUnitColor = (unit: string): string => {
        const colors: Record<string, string> = {
            'Unidade': '#3b82f6',
            'Caixas': '#10b981',
            'Pacote': '#f59e0b',
            'Kg': '#ef4444',
            'Metro': '#8b5cf6',
            'Litro': '#ec4899',
            'Par': '#06b6d4',
            'Dúzia': '#f97316'
        }
        return colors[unit] || '#64748b'
    }

    // Detectar o tema atual
    useEffect(() => {
        const checkTheme = () => {
            const isDark = document.documentElement.classList.contains('dark')
            setIsDarkMode(isDark)
        }

        checkTheme()
        const observer = new MutationObserver(checkTheme)
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
        return () => observer.disconnect()
    }, [])

    // Função para buscar dados com filtros
    const fetchData = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (startDate) params.append('startDate', startDate)
            if (endDate) params.append('endDate', endDate)
            if (selectedCostCenter && selectedCostCenter !== 'todos') {
                params.append('costCenter', selectedCostCenter)
            }

            console.log('🔍 Buscando dados com filtros:', {
                startDate,
                endDate,
                costCenter: selectedCostCenter,
                url: `/api/dashboard?${params.toString()}`
            })

            const response = await fetch(`/api/dashboard?${params.toString()}`)
            if (!response.ok) throw new Error('Erro ao carregar dados')
            const json = await response.json()

            // Log detalhado dos dados retornados
            console.log('✅ Dados recebidos:', {
                totalProductOrders: json.totalProductOrders,
                totalServiceOrders: json.totalServiceOrders,
                topSuppliersCount: json.topSuppliers?.length,
                topItemsCount: json.topItems?.length,
                firstItem: json.topItems?.[0],
                firstSupplier: json.topSuppliers?.[0]
            })

            setData(json)
            setAvailableCostCenters(json.availableCostCenters || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido')
        } finally {
            setLoading(false)
        }
    }

    // Buscar dados quando os filtros mudarem
    useEffect(() => {
        fetchData()
    }, [startDate, endDate, selectedCostCenter])

    // Aplicar filtro de data
    const handleApplyFilter = () => {
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            alert('Data inicial não pode ser maior que data final')
            return
        }
        setShowDateFilter(false)
    }

    // Limpar filtro de data
    const handleClearFilter = () => {
        setStartDate('')
        setEndDate('')
        setSelectedCostCenter('todos')
        setShowDateFilter(false)
    }

    if (loading && !data) {
        return (
            <div className="space-y-6 p-6">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Skeleton className="h-96 rounded-xl" />
                    <Skeleton className="h-96 rounded-xl" />
                </div>
                <Skeleton className="h-64 rounded-xl" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg">
                    <h2 className="font-semibold">Erro ao carregar dashboard</h2>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            </div>
        )
    }

    if (!data) return null

    return (
        <div className="space-y-6 animate-fade-in p-6">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground">Visão geral do sistema</p>
                </div>

                {/* Botão de filtro */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDateFilter(!showDateFilter)}
                        className="flex items-center gap-2"
                    >
                        <Calendar className="w-4 h-4 text-foreground" />
                        {startDate && endDate ? (
                            <span>Filtro ativo</span>
                        ) : (
                            <span>Filtrar</span>
                        )}
                    </Button>

                    {(startDate || endDate || selectedCostCenter !== 'todos') && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFilter}
                            className="text-muted-foreground"
                        >
                            <X className="w-4 h-4 text-foreground" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Painel de filtros */}
            {showDateFilter && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border rounded-lg p-4 mb-4"
                >
                    <h3 className="text-sm font-medium mb-3">Filtrar por período e centro de custo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Data inicial</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Data final</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Centro de Custo</label>
                            <select
                                value={selectedCostCenter}
                                onChange={(e) => setSelectedCostCenter(e.target.value)}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground"
                            >
                                <option value="todos">Todos os centros</option>
                                {availableCostCenters.map((cc) => (
                                    <option key={cc.code} value={cc.code}>
                                        {cc.name} {/* Agora mostra o nome em vez do código */}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end gap-2">
                            <Button onClick={handleApplyFilter} className="h-10 flex-1">
                                <Filter className="w-4 h-4 mr-2" />
                                Aplicar
                            </Button>
                            <Button variant="ghost" onClick={() => setShowDateFilter(false)} className="h-10">
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Indicador de filtros ativos */}
            {(startDate || endDate || selectedCostCenter !== 'todos') && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 p-2 rounded-lg flex-wrap">
                    <Filter className="w-4 h-4" />
                    <span>Filtros ativos:</span>
                    {startDate && endDate && (
                        <span className="bg-primary/10 px-2 py-1 rounded">
                            {new Date(startDate).toLocaleDateString('pt-BR')} até {new Date(endDate).toLocaleDateString('pt-BR')}
                        </span>
                    )}
                    {selectedCostCenter !== 'todos' && (
                        <span className="bg-primary/10 px-2 py-1 rounded">
                            Centro: {selectedCostCenter}
                        </span>
                    )}
                </div>
            )}

            {/* Cards de estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total de Produtos por Pedido"
                    value={formatNumber(data.totalProductOrders)}
                    subtitle="Quantidade de pedidos de produto"
                    icon={Package}
                    variant="info"
                />

                <StatCard
                    title="Valor Total dos Produtos por Pedido"
                    value={formatCurrency(data.totalProductOrdersValue)}
                    subtitle="Soma dos valores de pedidos de produto"
                    icon={DollarSign}
                    variant="success"
                />

                <StatCard
                    title="Total de Serviços por Pedido"
                    value={formatNumber(data.totalServiceOrders)}
                    subtitle="Quantidade de pedidos de serviço"
                    icon={Briefcase}
                    variant="info"
                />

                <StatCard
                    title="Valor Total de Serviços por Pedido"
                    value={formatCurrency(data.totalServiceOrdersValue)}
                    subtitle="Soma dos valores de pedidos de serviço"
                    icon={DollarSign}
                    variant="success"
                />
            </div>

            {/* Grid principal com Top 10 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 10 Fornecedores */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card rounded-xl border p-5 h-fit"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-card-foreground">
                            Top 10 Fornecedores
                        </h3>
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {data.topSuppliers.map((supplier, index) => (
                            <motion.div
                                key={supplier.document}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center justify-between p-2 hover:bg-muted/30 rounded-lg transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`
                                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                        ${index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400' :
                                            index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                                                index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400' :
                                                    'bg-muted text-muted-foreground'
                                        }
                                    `}>
                                        {index + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {supplier.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {supplier.orderCount} pedido{supplier.orderCount !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-primary">
                                        {formatCurrency(supplier.totalValue)}
                                    </p>
                                    {data.topSuppliers[0]?.totalValue > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            {((supplier.totalValue / data.topSuppliers[0].totalValue) * 100).toFixed(1)}%
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        ))}

                        {data.topSuppliers.length === 0 && (
                            <p className="text-center text-muted-foreground py-4">
                                Nenhum fornecedor encontrado no período
                            </p>
                        )}
                    </div>
                </motion.div>

                {/* Top 10 Itens Mais Pedidos */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card rounded-xl border p-5 h-fit"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-card-foreground">
                            Top 10 Itens Mais Pedidos
                        </h3>
                        <Package className="w-5 h-5 text-muted-foreground" />
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {data.topItems.map((item, index) => (
                            <motion.div
                                key={`${item.name}-${index}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center justify-between p-2 hover:bg-muted/30 rounded-lg transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`
                                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                        ${index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400' :
                                            index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                                                index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400' :
                                                    'bg-muted text-muted-foreground'
                                        }
                                    `}>
                                        {index + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {item.name}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="bg-muted px-1.5 py-0.5 rounded-full">
                                                {item.group}
                                            </span>
                                            <span>{item.orderCount}x</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-primary">
                                        {formatCurrency(item.totalValue)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.totalQuantity} un.
                                    </p>
                                </div>
                            </motion.div>
                        ))}

                        {data.topItems.length === 0 && (
                            <p className="text-center text-muted-foreground py-4">
                                Nenhum item encontrado no período
                            </p>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Gráfico de pizza - Unidades de Medida */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card rounded-xl border p-5"
            >
                <h3 className="font-semibold text-card-foreground mb-4">
                    Produtos por Unidade de Medida
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={data.unitMeasureData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    dataKey="value"
                                    paddingAngle={2}
                                    label={(entry) => entry.value > 0 ? entry.value : ''}
                                >
                                    {data.unitMeasureData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={getUnitColor(entry.name)}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                                        border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                    }}
                                    formatter={(value: any) => [`${value} produtos`, 'Quantidade']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {data.unitMeasureData.map((item) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: item.fill }}
                                    />
                                    <div>
                                        <p className="text-xs font-medium truncate">
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.value} produto{item.value !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-border">
                            <p className="text-xs text-muted-foreground text-center">
                                Total de {formatNumber(data.unitMeasureData.reduce((acc, curr) => acc + curr.value, 0))} produtos cadastrados
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}