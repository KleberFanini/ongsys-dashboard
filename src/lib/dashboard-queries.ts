// ongsys-dashboard/src/lib/dashboard-queries.ts
import { query } from './db'
import { DashboardSummary, DateFilter, TopSupplier, TopItem, CostCenter } from './dashboard-types'

export async function getDashboardSummary(filters?: DateFilter): Promise<DashboardSummary> {
  try {
    const { startDate, endDate, costCenter } = filters || {}

    console.log('='.repeat(50))
    console.log('🔍 FILTRO RECEBIDO:', { startDate, endDate, costCenter })
    console.log('='.repeat(50))

    // Preparar parâmetros da query
    const queryParams: any[] = []
    let paramIndex = 1

    // Query base para produtos
    let produtosQuery = `
      SELECT 
          COALESCE(COUNT(DISTINCT p.id), 0) as total_pedidos,
          COALESCE(SUM(p.valor_total), 0) as valor_total
      FROM pedidos p
      WHERE LOWER(p.tipo_pedido) = 'produto'
    `

    // Query base para serviços
    let servicosQuery = `
      SELECT 
          COALESCE(COUNT(DISTINCT p.id), 0) as total_pedidos,
          COALESCE(SUM(p.valor_total), 0) as valor_total
      FROM pedidos p
      WHERE (LOWER(p.tipo_pedido) = 'serviço' OR LOWER(p.tipo_pedido) = 'servico')
    `

    // Aplicar filtros de data
    if (startDate) {
      const dateCondition = ` AND p.data_pedido >= $${paramIndex}`
      produtosQuery += dateCondition
      servicosQuery += dateCondition
      queryParams.push(startDate)
      paramIndex++
    }

    if (endDate) {
      const dateCondition = ` AND p.data_pedido <= $${paramIndex}`
      produtosQuery += dateCondition
      servicosQuery += dateCondition
      queryParams.push(endDate)
      paramIndex++
    }

    // APLICAR FILTRO DE CENTRO DE CUSTO
    if (costCenter && costCenter !== 'todos') {
      const centerCondition = ` AND EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(p.itens_pedido) as item
        WHERE item->>'centroCusto' = $${paramIndex}
      )`

      produtosQuery += centerCondition
      servicosQuery += centerCondition
      queryParams.push(costCenter)
      paramIndex++
    }

    console.log('📊 Query produtos:', produtosQuery)
    console.log('📊 Parâmetros:', queryParams)

    // Executar queries de totais
    const produtosResult = await query(produtosQuery, queryParams)
    const servicosResult = await query(servicosQuery, queryParams)

    const produtos = produtosResult.rows[0] || { total_pedidos: 0, valor_total: 0 }
    const servicos = servicosResult.rows[0] || { total_pedidos: 0, valor_total: 0 }

    // Buscar TOP 10 FORNECEDORES com filtro
    let topSuppliersQuery = `
      SELECT 
          p.fornecedor_nome as name,
          p.fornecedor_documento as document,
          SUM(p.valor_total) as total_value,
          COUNT(DISTINCT p.id) as order_count
      FROM pedidos p
      WHERE p.fornecedor_nome IS NOT NULL 
      AND p.fornecedor_nome != ''
    `

    const supplierParams: any[] = []
    let supplierIndex = 1

    if (startDate) {
      topSuppliersQuery += ` AND p.data_pedido >= $${supplierIndex}`
      supplierParams.push(startDate)
      supplierIndex++
    }
    if (endDate) {
      topSuppliersQuery += ` AND p.data_pedido <= $${supplierIndex}`
      supplierParams.push(endDate)
      supplierIndex++
    }

    if (costCenter && costCenter !== 'todos') {
      topSuppliersQuery += ` AND EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(p.itens_pedido) as item
        WHERE item->>'centroCusto' = $${supplierIndex}
      )`
      supplierParams.push(costCenter)
      supplierIndex++
    }

    topSuppliersQuery += `
      GROUP BY p.fornecedor_nome, p.fornecedor_documento
      ORDER BY total_value DESC
      LIMIT 10
    `

    const topSuppliersResult = await query(topSuppliersQuery, supplierParams)

    // Buscar TOP 10 ITENS com filtro
    let topItemsQuery = `
      SELECT 
          COALESCE(item->>'nomeServico', item->>'nomeProduto', 'Item sem nome') as name,
          COALESCE(item->>'grupo', 'Sem grupo') as group,
          SUM(COALESCE((item->>'quantidade')::numeric, 0)) as total_quantity,
          SUM(
            COALESCE((item->>'quantidade')::numeric, 0) * 
            COALESCE((item->>'valorUnitario')::numeric, 0)
          ) as total_value,
          COUNT(DISTINCT p.id) as order_count
      FROM pedidos p
      CROSS JOIN LATERAL jsonb_array_elements(p.itens_pedido) as item
      WHERE p.itens_pedido IS NOT NULL 
      AND jsonb_array_length(p.itens_pedido) > 0
    `

    const itemParams: any[] = []
    let itemIndex = 1

    if (startDate) {
      topItemsQuery += ` AND p.data_pedido >= $${itemIndex}`
      itemParams.push(startDate)
      itemIndex++
    }
    if (endDate) {
      topItemsQuery += ` AND p.data_pedido <= $${itemIndex}`
      itemParams.push(endDate)
      itemIndex++
    }

    if (costCenter && costCenter !== 'todos') {
      topItemsQuery += ` AND item->>'centroCusto' = $${itemIndex}`
      itemParams.push(costCenter)
      itemIndex++
    }

    topItemsQuery += `
      GROUP BY item->>'nomeServico', item->>'nomeProduto', item->>'grupo'
      ORDER BY total_value DESC
      LIMIT 10
    `

    const topItemsResult = await query(topItemsQuery, itemParams)

    // Buscar outros dados (sem filtro de centro pois são globais)
    const fornecedoresResult = await query(`SELECT COUNT(*) as total FROM fornecedores`, [])
    const pagarResult = await query(`SELECT COALESCE(SUM(valor_liquido), 0) as total FROM contas_pagar`, [])
    const receberResult = await query(`SELECT COALESCE(SUM(valor_liquido), 0) as total FROM contas_receber`, [])

    // Buscar distribuição por unidade de medida
    const unitMeasureResult = await query(`
      SELECT 
          COALESCE(unidadeMedida, 'Não informada') as name,
          COUNT(*) as value
      FROM produtos
      GROUP BY unidadeMedida
      ORDER BY value DESC
      LIMIT 8
    `, [])

    // Buscar centros de custo disponíveis para o select
    const availableCostCenters = await getAvailableCostCenters(startDate, endDate)

    const COLORS = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
      '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'
    ]

    // Mapear resultados
    const topSuppliers: TopSupplier[] = topSuppliersResult.rows.map((row: any) => ({
      name: row.name || 'Nome não informado',
      document: row.document || '---',
      totalValue: parseFloat(row.total_value) || 0,
      orderCount: parseInt(row.order_count) || 0
    }))

    const topItems: TopItem[] = topItemsResult.rows.map((row: any) => ({
      name: row.name || 'Item sem nome',
      group: row.group || 'Sem grupo',
      totalQuantity: parseFloat(row.total_quantity) || 0,
      totalValue: parseFloat(row.total_value) || 0,
      orderCount: parseInt(row.order_count) || 0
    }))

    console.log('📊 RESULTADOS FILTRADOS:')
    console.log('  - Centro filtrado:', costCenter || 'todos')
    console.log('  - Total produtos:', produtos.total_pedidos)
    console.log('  - Total serviços:', servicos.total_pedidos)
    console.log('  - Top fornecedor:', topSuppliers[0]?.name || 'Nenhum')
    console.log('  - Pedidos top fornecedor:', topSuppliers[0]?.orderCount || 0)

    return {
      totalProductOrders: parseInt(produtos.total_pedidos) || 0,
      totalProductOrdersValue: parseFloat(produtos.valor_total) || 0,
      totalServiceOrders: parseInt(servicos.total_pedidos) || 0,
      totalServiceOrdersValue: parseFloat(servicos.valor_total) || 0,
      totalSuppliers: parseInt(fornecedoresResult.rows[0]?.total) || 0,
      totalPayable: parseFloat(pagarResult.rows[0]?.total) || 0,
      totalReceivable: parseFloat(receberResult.rows[0]?.total) || 0,
      lowStockProducts: 0,
      topSuppliers,
      topItems,
      availableCostCenters,
      unitMeasureData: unitMeasureResult.rows.map((row: any, index: number) => ({
        name: row.name || 'Não informada',
        value: parseInt(row.value) || 0,
        fill: COLORS[index % COLORS.length]
      })),
      recentAccounts: []
    }
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    throw error
  }
}

async function getAvailableCostCenters(startDate?: string, endDate?: string): Promise<CostCenter[]> {
  try {
    let queryText = `
      SELECT DISTINCT 
          item->>'centroCusto' as code,
          COUNT(*) as total
      FROM pedidos p
      CROSS JOIN LATERAL jsonb_array_elements(p.itens_pedido) as item
      WHERE p.itens_pedido IS NOT NULL 
      AND jsonb_array_length(p.itens_pedido) > 0
      AND item->>'centroCusto' IS NOT NULL 
      AND item->>'centroCusto' != ''
    `

    const params: any[] = []
    let paramIndex = 1

    if (startDate) {
      queryText += ` AND p.data_pedido >= $${paramIndex}`
      params.push(startDate)
      paramIndex++
    }
    if (endDate) {
      queryText += ` AND p.data_pedido <= $${paramIndex}`
      params.push(endDate)
      paramIndex++
    }

    queryText += ` GROUP BY item->>'centroCusto' ORDER BY total DESC LIMIT 50`

    const result = await query(queryText, params)

    return result.rows.map((row: any) => ({
      code: row.code || 'Não informado',
      name: row.code || 'Não informado',
      totalValue: 0,
      orderCount: parseInt(row.total) || 0
    }))
  } catch (error) {
    console.error('Erro ao buscar centros de custo:', error)
    return []
  }
}