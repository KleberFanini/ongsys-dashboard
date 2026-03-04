'use client'

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Search, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { Skeleton } from "@/src/components/ui/skeleton"
import { SupplierView } from "@/src/lib/supplier-types"

const PAGE_SIZE = 20

export default function FornecedoresPage() {
    const [suppliers, setSuppliers] = useState<SupplierView[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [page, setPage] = useState(1)
    const [selected, setSelected] = useState<SupplierView | null>(null)
    const [totalPages, setTotalPages] = useState(1)

    // Buscar dados da API
    useEffect(() => {
        async function fetchSuppliers() {
            setLoading(true)
            try {
                const params = new URLSearchParams()
                if (search) params.append('search', search)
                if (typeFilter !== 'all') params.append('type', typeFilter)
                params.append('page', page.toString())

                const response = await fetch(`/api/fornecedores?${params.toString()}`)
                const data = await response.json()

                setSuppliers(data.data)
                setTotalPages(data.totalPages)
            } catch (error) {
                console.error('Erro ao buscar fornecedores:', error)
            } finally {
                setLoading(false)
            }
        }

        // Debounce para evitar muitas requisições
        const timer = setTimeout(() => {
            fetchSuppliers()
        }, 500)

        return () => clearTimeout(timer)
    }, [search, typeFilter, page])

    // Resetar página quando filtros mudam
    useEffect(() => {
        setPage(1)
    }, [search, typeFilter])

    if (loading && suppliers.length === 0) {
        return (
            <div className="space-y-4 p-6">
                <Skeleton className="h-8 w-48" />
                <div className="flex gap-3">
                    <Skeleton className="h-10 flex-1 max-w-sm" />
                    <Skeleton className="h-10 w-36" />
                </div>
                {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-5 animate-fade-in p-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Fornecedores</h1>
                <p className="text-muted-foreground">
                    {suppliers.length.toLocaleString("pt-BR")} fornecedores encontrados
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome, código ou documento..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                        <SelectItem value="PF">Pessoa Física</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="text-left p-3 text-muted-foreground font-medium">Código</th>
                                <th className="text-left p-3 text-muted-foreground font-medium">Nome</th>
                                <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Documento</th>
                                <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Tipo</th>
                                <th className="text-left p-3 text-muted-foreground font-medium hidden lg:table-cell">Email</th>
                                <th className="text-left p-3 text-muted-foreground font-medium hidden lg:table-cell">Telefone</th>
                                <th className="text-center p-3 text-muted-foreground font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map((sup) => (
                                <tr
                                    key={sup.id}
                                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                                >
                                    <td className="p-3 font-mono text-xs text-card-foreground">{sup.code}</td>
                                    <td className="p-3 text-card-foreground font-medium">{sup.name}</td>
                                    <td className="p-3 text-muted-foreground hidden md:table-cell font-mono text-xs">
                                        {sup.document}
                                    </td>
                                    <td className="p-3 hidden sm:table-cell">
                                        <Badge
                                            variant="outline"
                                            className={
                                                sup.personType === "PJ"
                                                    ? "border-primary/30 text-primary"
                                                    : "border-chart-5/30 text-chart-5"
                                            }
                                        >
                                            {sup.personType === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}
                                        </Badge>
                                    </td>
                                    <td className="p-3 text-muted-foreground hidden lg:table-cell">{sup.email}</td>
                                    <td className="p-3 text-muted-foreground hidden lg:table-cell">{sup.phone}</td>
                                    <td className="p-3 text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelected(sup)}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
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
            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Fornecedor</DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-border">
                                <span className="text-muted-foreground text-sm">Código</span>
                                <span className="text-card-foreground text-sm font-medium">{selected.code}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-border">
                                <span className="text-muted-foreground text-sm">Nome</span>
                                <span className="text-card-foreground text-sm font-medium">{selected.name}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-border">
                                <span className="text-muted-foreground text-sm">Documento</span>
                                <span className="text-card-foreground text-sm font-medium">{selected.document}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-border">
                                <span className="text-muted-foreground text-sm">Tipo</span>
                                <span className="text-card-foreground text-sm font-medium">
                                    {selected.personType === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-border">
                                <span className="text-muted-foreground text-sm">Email</span>
                                <span className="text-card-foreground text-sm font-medium">{selected.email}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-border">
                                <span className="text-muted-foreground text-sm">Telefone</span>
                                <span className="text-card-foreground text-sm font-medium">{selected.phone}</span>
                            </div>
                            {selected.city && (
                                <div className="flex justify-between py-2 border-b border-border">
                                    <span className="text-muted-foreground text-sm">Cidade</span>
                                    <span className="text-card-foreground text-sm font-medium">
                                        {selected.city} - {selected.state}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}