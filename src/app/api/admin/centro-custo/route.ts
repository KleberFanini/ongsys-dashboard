import { NextResponse } from 'next/server'

const API_CONFIG = {
    baseUrl: 'https://www.ongsys.com.br/app/index.php/api/v2',
    username: process.env.API_USERNAME || '03970',
    password: process.env.API_PASSWORD || ''
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
    const auth = Buffer.from(`${API_CONFIG.username}:${API_CONFIG.password}`).toString('base64')

    const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    })

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
    }

    return response.json()
}

export async function GET() {
    try {
        let allCentrosCusto = new Set<string>()
        let page = 1
        let hasMore = true

        while (hasMore) {
            const response = await apiRequest(`/pedidos?pageNumber=${page}&limit=100`)

            if (!response || !response.data) {
                break
            }

            const pedidos = Array.isArray(response.data) ? response.data : response.data.pedidos || []

            if (pedidos.length === 0) {
                hasMore = false
                break
            }

            // Extrai centros de custo dos itens
            pedidos.forEach((pedido: any) => {
                if (pedido.itensPedido && Array.isArray(pedido.itensPedido)) {
                    pedido.itensPedido.forEach((item: any) => {
                        if (item.centroCusto && item.centroCusto.trim()) {
                            allCentrosCusto.add(item.centroCusto)
                        }
                    })
                }
            })

            // Se veio menos itens que o limite, é a última página
            if (pedidos.length < 100) {
                hasMore = false
            } else {
                page++
            }
        }

        const centrosCusto = Array.from(allCentrosCusto)
            .sort()
            .map(cc => ({
                id: cc,
                nome: cc,
                descricao: `Centro de Custo ${cc}`
            }))

        return NextResponse.json(centrosCusto)

    } catch (error) {
        console.error('Erro ao buscar centros de custo:', error)
        return NextResponse.json([], { status: 500 })
    }
}