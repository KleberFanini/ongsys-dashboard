// ongsys-dashboard/src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Função para formatar CPF/CNPJ
export function formatDocument(doc: string): string {
    if (!doc) return '---'

    const numbers = doc.replace(/\D/g, '')

    if (numbers.length === 11) {
        return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }

    if (numbers.length === 14) {
        return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }

    return doc
}

// Função para formatar moeda (BR)
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(value)
}

// Função para identificar o tipo de documento
export function getDocumentType(doc: string): 'CPF' | 'CNPJ' | 'Outro' {
    if (!doc) return 'Outro'

    const numbers = doc.replace(/\D/g, '')

    if (numbers.length === 11) return 'CPF'
    if (numbers.length === 14) return 'CNPJ'
    return 'Outro'
}