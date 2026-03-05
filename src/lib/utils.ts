// ongsys-dashboard/src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Função para formatar CPF/CNPJ
export function formatDocument(doc: string): string {
    if (!doc) return '---'

    // Remove tudo que não é número
    const numbers = doc.replace(/\D/g, '')

    // CPF: 11 dígitos
    if (numbers.length === 11) {
        return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }

    // CNPJ: 14 dígitos
    if (numbers.length === 14) {
        return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }

    // Se não for nem CPF nem CNPJ, retorna o original
    return doc
}

// Função para identificar o tipo de documento
export function getDocumentType(doc: string): 'CPF' | 'CNPJ' | 'Outro' {
    if (!doc) return 'Outro'

    const numbers = doc.replace(/\D/g, '')

    if (numbers.length === 11) return 'CPF'
    if (numbers.length === 14) return 'CNPJ'
    return 'Outro'
}