'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Label } from "@/src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Moon, Sun, Monitor } from "lucide-react"

export function ConfiguracoesModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
    const [itemsPerPage, setItemsPerPage] = useState("20")

    // Carregar configurações salvas
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
        const savedItemsPerPage = localStorage.getItem('itemsPerPage')

        if (savedTheme) setTheme(savedTheme)
        if (savedItemsPerPage) setItemsPerPage(savedItemsPerPage)
    }, [])

    const handleSave = () => {
        // Salvar preferências no localStorage
        localStorage.setItem('theme', theme)
        localStorage.setItem('itemsPerPage', itemsPerPage)

        // Aplicar tema
        if (theme === 'dark') {
            document.documentElement.classList.add('dark')
        } else if (theme === 'light') {
            document.documentElement.classList.remove('dark')
        } else {
            // system - verificar preferência do sistema
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            if (isDark) {
                document.documentElement.classList.add('dark')
            } else {
                document.documentElement.classList.remove('dark')
            }
        }

        alert('Configurações salvas com sucesso!')
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Configurações</DialogTitle>
                    <DialogDescription>
                        Personalize a aparência e comportamento do sistema.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <Label>Tema</Label>
                        <div className="flex gap-2">
                            <Button
                                variant={theme === 'light' ? 'default' : 'outline'}
                                onClick={() => setTheme('light')}
                                className="flex-1"
                            >
                                <Sun className="w-4 h-4 mr-2" />
                                Claro
                            </Button>
                            <Button
                                variant={theme === 'dark' ? 'default' : 'outline'}
                                onClick={() => setTheme('dark')}
                                className="flex-1"
                            >
                                <Moon className="w-4 h-4 mr-2" />
                                Escuro
                            </Button>
                            <Button
                                variant={theme === 'system' ? 'default' : 'outline'}
                                onClick={() => setTheme('system')}
                                className="flex-1"
                            >
                                <Monitor className="w-4 h-4 mr-2" />
                                Sistema
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Itens por página padrão</Label>
                        <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10 itens</SelectItem>
                                <SelectItem value="20">20 itens</SelectItem>
                                <SelectItem value="50">50 itens</SelectItem>
                                <SelectItem value="100">100 itens</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} className="flex-1">
                            Salvar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}