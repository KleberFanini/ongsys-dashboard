// ongsys-dashboard/src/app/dashboard/page.tsx
'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Package,
    DollarSign,
    ShoppingCart,
    Briefcase,
    TrendingUp,
    Calendar,
    Filter,
    X
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
import { DashboardSummary } from "@/src/lib/dashboard-types"

const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

const formatNumber = (v: number) =>
    new Intl.NumberFormat("pt-BR").format(v)

export default function DashboardPage() {
    const [data, setData] = useState<DashboardSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isDarkMode, setIsDarkMode] = useState(false)

    // Estados para filtro de data
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
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

            console.log('🔍 Buscando dados com filtros:', { startDate, endDate })

            const response = await fetch(`/api/dashboard?${params.toString()}`)
            if (!response.ok) throw new Error('Erro ao carregar dados')
            const json = await response.json()
            setData(json)
            console.log('✅ Dados atualizados:', json)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido')
        } finally {
            setLoading(false)
        }
    }

    // Buscar dados quando os filtros mudarem
    useEffect(() => {
        fetchData()
    }, [startDate, endDate])

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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Skeleton className="h-80 rounded-xl lg:col-span-2" />
                    <Skeleton className="h-80 rounded-xl" />
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground">Visão geral do sistema</p>
                </div>

                {/* Botão de filtro de data */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDateFilter(!showDateFilter)}
                        className="flex items-center gap-2"
                    >
                        <Calendar className="w-4 h-4 text-foreground" />
                        {startDate && endDate ? (
                            <span>Filtro ativo: {new Date(startDate).toLocaleDateString('pt-BR')} - {new Date(endDate).toLocaleDateString('pt-BR')}</span>
                        ) : (
                            <span>Filtrar por período</span>
                        )}
                    </Button>

                    {startDate && endDate && (
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

            {/* Painel de filtro de data */}
            {showDateFilter && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border rounded-lg p-4 mb-4"
                >
                    <h3 className="text-sm font-medium mb-3">Filtrar por período</h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <label className="text-xs text-muted-foreground mb-1 block">Data inicial</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full  text-foreground"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-muted-foreground mb-1 block">Data final</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <Button onClick={handleApplyFilter} className="h-10">
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

            {/* Indicador de filtro ativo */}
            {startDate && endDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 p-2 rounded-lg">
                    <Calendar className="w-4 h-4 text-foreground" />
                    <span>Mostrando dados de <strong>{new Date(startDate).toLocaleDateString('pt-BR')}</strong> até <strong>{new Date(endDate).toLocaleDateString('pt-BR')}</strong></span>
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

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Gráfico de barras - Fluxo mensal */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 bg-card rounded-xl border p-5"
                >
                    <h3 className="font-semibold text-card-foreground mb-4">
                        Fluxo Financeiro (últimos 6 meses)
                    </h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={data.monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                            <XAxis
                                dataKey="month"
                                stroke={isDarkMode ? '#94a3b8' : '#64748b'}
                                fontSize={12}
                            />
                            <YAxis
                                stroke={isDarkMode ? '#94a3b8' : '#64748b'}
                                fontSize={12}
                                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div
                                                style={{
                                                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                                                    border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                                                    padding: '8px 12px',
                                                }}
                                            >
                                                <p style={{
                                                    color: isDarkMode ? '#f8fafc' : '#0f172a',
                                                    fontWeight: 600,
                                                    marginBottom: '4px'
                                                }}>
                                                    {label}
                                                </p>
                                                {payload.map((entry, index) => (
                                                    <div key={index} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        gap: '16px',
                                                        padding: '2px 0'
                                                    }}>
                                                        <span style={{ color: entry.color }}>
                                                            {entry.name}:
                                                        </span>
                                                        <span style={{
                                                            color: entry.color,
                                                            fontWeight: 500
                                                        }}>
                                                            {formatCurrency(entry.value as number)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Bar
                                dataKey="payable"
                                name="A Pagar"
                                fill="#ef4444"
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar
                                dataKey="receivable"
                                name="A Receber"
                                fill="#22c55e"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Gráfico de pizza - Unidades de Medida */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card rounded-xl border p-5"
                >
                    <h3 className="font-semibold text-card-foreground mb-4">
                        Produtos por Unidade de Medida
                    </h3>
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
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Legenda com cores */}
                    <div className="flex justify-center gap-3 mt-3 flex-wrap">
                        {data.unitMeasureData.map((item) => (
                            <div key={item.name} className="flex items-center gap-1.5 text-xs">
                                <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: item.fill }}
                                />
                                <span className="text-muted-foreground">
                                    {item.name}: {item.value}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Total de produtos */}
                    <div className="mt-3 pt-3 border-t border-border text-center">
                        <p className="text-xs text-muted-foreground">
                            Total de {formatNumber(data.unitMeasureData.reduce((acc, curr) => acc + curr.value, 0))} produtos cadastrados
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}