// src/lib/dashboard-queries.ts
import {
  pedidosService,
  DateFilter
} from './api/services'
import { DashboardSummary, TopSupplier, TopItem, CostCenter, RecentAccount } from './dashboard-types'
import { getCostCenterName } from './cost-centers-map'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/auth'

// Função para extrair valor do pedido (soma dos itens)
function extractValueFromPedido(pedido: any): number {
  if (pedido.valorTotal && typeof pedido.valorTotal === 'number') {
    return pedido.valorTotal
  }
  if (pedido.valor_total && typeof pedido.valor_total === 'number') {
    return pedido.valor_total
  }
  if (pedido.total && typeof pedido.total === 'number') {
    return pedido.total
  }

  // Fallback: Tentar encontrar nos itens
  if (pedido.itensPedido && Array.isArray(pedido.itensPedido)) {
    const total = pedido.itensPedido.reduce((acc: number, item: any) => {
      const quantidade = parseFloat(item.quantidade) || 0

      let valorUnitario = 0
      if (item.valorUnitario) valorUnitario = parseFloat(item.valorUnitario)
      else if (item.precoUnitario) valorUnitario = parseFloat(item.precoUnitario)
      else if (item.preco) valorUnitario = parseFloat(item.preco)
      else if (item.valor) valorUnitario = parseFloat(item.valor)
      else if (item.valorTotal) return acc + parseFloat(item.valorTotal)

      return acc + (quantidade * valorUnitario)
    }, 0)

    if (total > 0) return total
  }

  return 0
}

export async function getDashboardSummaryFromAPI(filters?: DateFilter): Promise<DashboardSummary> {
  try {
    // 🔥 OBTER SESSÃO DO SERVIDOR PARA VERIFICAR O USUÁRIO
    const session = await getServerSession(authOptions)
    const userRole = session?.user?.role
    const userCentroCusto = session?.user?.centroCusto

    let { startDate, endDate, costCenter } = filters || {}

    // 🔥 SE FOR CONSULTOR, FORÇAR O FILTRO PELO CENTRO DE CUSTO DELE
    if (userRole === 'CONSULTOR' && userCentroCusto) {
      costCenter = userCentroCusto
      console.log(`🔒 Consultor filtrado por centro: ${userCentroCusto}`)
    }

    console.log('🔍 Buscando dados do dashboard...')
    const startTime = Date.now()

    // Buscar APENAS pedidos
    let pedidos = await pedidosService.listarTodos({ startDate, endDate })

    const totalTime = Date.now() - startTime
    console.log(`⏱️ Dados carregados em ${totalTime}ms`)
    console.log(`📊 Dados recebidos:`)
    console.log(`  - Pedidos: ${pedidos.length}`)

    // Filtrar pedidos por centro de custo (se necessário)
    let pedidosFiltrados = pedidos
    if (costCenter && costCenter !== 'todos') {
      pedidosFiltrados = pedidos.filter((pedido: any) =>
        pedido.itensPedido?.some((item: any) => item.centroCusto === costCenter)
      )
      console.log(`  - Pedidos após filtro por centro ${costCenter}: ${pedidosFiltrados.length}`)
    }

    // Separar por tipo
    const pedidosProduto = pedidosFiltrados.filter((p: any) =>
      p.tipoPedido?.toLowerCase() === 'produto'
    )
    const pedidosServico = pedidosFiltrados.filter((p: any) =>
      p.tipoPedido?.toLowerCase() === 'serviço' || p.tipoPedido?.toLowerCase() === 'servico'
    )

    // Calcular valores
    const totalProductOrders = pedidosProduto.length
    const totalProductOrdersValue = pedidosProduto.reduce((acc: number, p: any) => acc + extractValueFromPedido(p), 0)
    const totalServiceOrders = pedidosServico.length
    const totalServiceOrdersValue = pedidosServico.reduce((acc: number, p: any) => acc + extractValueFromPedido(p), 0)

    // TOP 10 FORNECEDORES
    const supplierMap = new Map<string, TopSupplier>()
    pedidosFiltrados.forEach((pedido: any) => {
      if (pedido.fornecedor?.nome) {
        const key = pedido.fornecedor.documento || pedido.fornecedor.nome
        if (!supplierMap.has(key)) {
          supplierMap.set(key, {
            name: pedido.fornecedor.nome,
            document: pedido.fornecedor.documento || '---',
            totalValue: 0,
            orderCount: 0
          })
        }
        const supplier = supplierMap.get(key)!
        supplier.totalValue += extractValueFromPedido(pedido)
        supplier.orderCount += 1
      }
    })

    const topSuppliers = Array.from(supplierMap.values())
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10)

    // TOP 10 ITENS
    const itemMap = new Map<string, TopItem>()
    pedidosFiltrados.forEach((pedido: any) => {
      pedido.itensPedido?.forEach((item: any) => {
        const key = item.nomeServico || item.nomeProduto || 'Item sem nome'
        if (!itemMap.has(key)) {
          itemMap.set(key, {
            name: key,
            group: item.grupo || 'Sem grupo',
            totalQuantity: 0,
            totalValue: 0,
            orderCount: 0
          })
        }
        const mapped = itemMap.get(key)!
        const quantity = parseFloat(item.quantidade) || 0
        const unitValue = parseFloat(item.valorUnitario) || 0
        mapped.totalQuantity += quantity
        mapped.totalValue += quantity * unitValue
        mapped.orderCount += 1
      })
    })

    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10)

    // CENTROS DE CUSTO DISPONÍVEIS (apenas para SUPER_ADMIN e OPERADOR_SEDE)
    let availableCostCenters: CostCenter[] = []
    if (userRole !== 'CONSULTOR') {
      const costCenterSet = new Set<string>()
      pedidos.forEach((pedido: any) => {
        pedido.itensPedido?.forEach((item: any) => {
          if (item.centroCusto) costCenterSet.add(item.centroCusto)
        })
      })

      availableCostCenters = Array.from(costCenterSet)
        .map(code => ({ code, name: getCostCenterName(code), totalValue: 0, orderCount: 0 }))
        .sort((a, b) => a.name.localeCompare(b.name))
    }

    console.log('📊 RESUMO FINAL:')
    console.log(`  - Total Pedidos Produto: ${totalProductOrders}`)
    console.log(`  - Valor Total Produtos: R$ ${totalProductOrdersValue.toFixed(2)}`)
    console.log(`  - Total Pedidos Serviço: ${totalServiceOrders}`)
    console.log(`  - Valor Total Serviços: R$ ${totalServiceOrdersValue.toFixed(2)}`)
    console.log(`  - Top Fornecedor: ${topSuppliers[0]?.name || 'Nenhum'}`)
    console.log(`  - Top Item: ${topItems[0]?.name || 'Nenhum'}`)

    return {
      totalProductOrders,
      totalProductOrdersValue,
      totalServiceOrders,
      totalServiceOrdersValue,
      totalSuppliers: 0,
      totalPayable: 0,
      totalReceivable: 0,
      lowStockProducts: 0,
      topSuppliers,
      topItems,
      availableCostCenters,
      unitMeasureData: [],
      recentAccounts: []
    }
  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error)
    throw error
  }
}