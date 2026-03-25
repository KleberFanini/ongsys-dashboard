// src/lib/api/client.ts
import { ApiParams, ApiResponse } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!
const API_USERNAME = process.env.API_USERNAME!
const API_PASSWORD = process.env.API_PASSWORD!

// Validações em runtime
if (!API_BASE_URL) {
    throw new Error('❌ NEXT_PUBLIC_API_URL não configurada no .env.local')
}
if (!API_USERNAME) {
    throw new Error('❌ API_USERNAME não configurada no .env.local')
}
if (!API_PASSWORD) {
    throw new Error('❌ API_PASSWORD não configurada no .env.local')
}

console.log('🔧 Configuração da API:', {
    baseUrl: API_BASE_URL,
    username: API_USERNAME.substring(0, 5) + '...',
    hasPassword: !!API_PASSWORD
})

function getAuthHeaders(): HeadersInit {
    const token = Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64')
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${token}`
    }
}

function buildUrl(endpoint: string, params: ApiParams): string {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            searchParams.append(key, String(value))
        }
    })

    // API_BASE_URL é string graças à validação
    const baseUrl = API_BASE_URL.replace(/\/$/, '')
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const queryString = searchParams.toString()
    const url = `${baseUrl}${path}${queryString ? '?' + queryString : ''}`

    console.log(`📍 URL: ${url}`)
    return url
}

export async function apiGet<T>(endpoint: string, params: ApiParams = {}): Promise<ApiResponse<T>> {
    const url = buildUrl(endpoint, params)
    const headers = getAuthHeaders()

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    try {
        console.log(`🌐 GET ${url}`)

        const response = await fetch(url, {
            headers,
            cache: 'no-store',
            signal: controller.signal
        })

        clearTimeout(timeoutId)
        console.log(`📥 Status: ${response.status}`)

        if (!response.ok) {
            const errorText = await response.text()
            if (response.status === 524) {
                console.warn(`⚠️ Timeout na API para ${endpoint}. Usando dados parciais.`)
                return {
                    data: [],
                    totalPages: 1,
                    currentPage: params.pageNumber || 1,
                    totalItems: 0
                }
            }
            throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`)
        }

        const data = await response.json()

        // CORREÇÃO AQUI: 100 itens por página, NÃO 10!
        const ITEMS_PER_PAGE = 100

        return {
            data: data.data || [],
            totalPages: Math.ceil((data.totalRecords || 0) / 100), // ← 100
            currentPage: params.pageNumber || 1,
            totalItems: data.totalRecords || 0
        }
    } catch (error: any) {
        clearTimeout(timeoutId)
        if (error.name === 'AbortError') {
            console.warn(`⚠️ Timeout: ${endpoint} demorou mais de 60s`)
            return {
                data: [],
                totalPages: 1,
                currentPage: params.pageNumber || 1,
                totalItems: 0
            }
        }
        console.error(`❌ Erro em ${endpoint}:`, error)
        throw error
    }
}