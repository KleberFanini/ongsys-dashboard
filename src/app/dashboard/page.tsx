// ongsys-dashboard/src/app/dashboard/page.tsx
'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Package,
    DollarSign,
    ShoppingCart,
    TrendingUp,
    Users
} from "lucide-react"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from "recharts"
import { StatCard } from "@/src/components/StatCard"
import { Skeleton } from "@/src/components/ui/skeleton"
import { Badge } from "@/src/components/ui/badge"
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

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('/api/dashboard')
                if (!response.ok) throw new Error('Erro ao carregar dados')
                const json = await response.json()
                setData(json)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erro desconhecido')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) {
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
            <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground">Visão geral do sistema</p>
            </div>

            {/* Cards de estatísticas - NOVA ORDEM */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total de Produtos */}
                <StatCard
                    title="Total de Produtos"
                    value={formatNumber(data.totalProducts)}
                    subtitle="Quantidade de produtos"
                    icon={Package}
                    variant="default"
                />

                {/* 2. Valor Total de Produtos */}
                <StatCard
                    title="Valor Total de Produtos"
                    value={formatCurrency(data.totalProductValue)}
                    subtitle="Soma dos preços de custo"
                    icon={DollarSign}
                    variant="success"
                />

                {/* 3. Total de Pedidos */}
                <StatCard
                    title="Total de Pedidos"
                    value={formatNumber(data.totalOrders)}
                    subtitle="Número de pedidos"
                    icon={ShoppingCart}
                    variant="info"
                />

                {/* 4. Valor Total de Pedidos */}
                <StatCard
                    title="Valor Total de Pedidos"
                    value={formatCurrency(data.totalOrderValue)}
                    subtitle="Soma dos valores"
                    icon={TrendingUp}
                    variant="purple"
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
                            Total de {formatNumber(data.totalProducts)} produtos cadastrados
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Tabela de contas recentes */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card rounded-xl border p-5"
            >
                <h3 className="font-semibold text-card-foreground mb-4">Contas Recentes</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left">
                                <th className="pb-3 text-muted-foreground font-medium">Código</th>
                                <th className="pb-3 text-muted-foreground font-medium">Entidade</th>
                                <th className="pb-3 text-muted-foreground font-medium">Vencimento</th>
                                <th className="pb-3 text-muted-foreground font-medium">Valor</th>
                                <th className="pb-3 text-muted-foreground font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.recentAccounts.map((account) => (
                                <tr key={`${account.type}-${account.id}`} className="border-b last:border-0">
                                    <td className="py-3 text-card-foreground font-mono text-xs">
                                        {account.code}
                                    </td>
                                    <td className="py-3 text-card-foreground">
                                        {account.entityName?.toUpperCase()}
                                    </td>
                                    <td className="py-3 text-muted-foreground">
                                        {new Date(account.dueDate).toLocaleDateString("pt-BR")}
                                    </td>
                                    <td className="py-3 text-card-foreground font-medium">
                                        {formatCurrency(account.value)}
                                    </td>
                                    <td className="py-3">
                                        <Badge
                                            variant="outline"
                                            className={
                                                account.status === "paid"
                                                    ? "border-success/30 text-success"
                                                    : account.status === "pending"
                                                        ? "border-warning/30 text-warning"
                                                        : "border-destructive/30 text-destructive"
                                            }
                                        >
                                            {account.status === "paid"
                                                ? account.type === "payable" ? "Pago" : "Recebido"
                                                : account.status === "pending"
                                                    ? "Pendente"
                                                    : "Vencido"
                                            }
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                            {data.recentAccounts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                                        Nenhuma conta encontrada
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    )
}