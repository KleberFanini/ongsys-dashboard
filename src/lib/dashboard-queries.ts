// ongsys-dashboard/src/lib/dashboard-queries.ts
import { query } from './db'
import { DashboardSummary } from './dashboard-types'

export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    // Buscar totais de produtos e pedidos
    const totalsResult = await query(`
      WITH produtos_stats AS (
        SELECT 
          COALESCE(COUNT(*), 0) as total_produtos,
          COALESCE(SUM(valorCustoBase), 0) as valor_total_produtos
        FROM produtos
      ),
      pedidos_stats AS (
        SELECT 
          COALESCE(COUNT(*), 0) as total_pedidos,
          COALESCE(SUM(valor_total), 0) as valor_total_pedidos
        FROM pedidos
      ),
      fornecedores_stats AS (
        SELECT COALESCE(COUNT(*), 0) as total_fornecedores
        FROM fornecedores
      ),
      pagar AS (
        SELECT 
          COALESCE(SUM(valor_liquido), 0) as total_valor_pagar
        FROM contas_pagar
      ),
      receber AS (
        SELECT 
          COALESCE(SUM(valor_liquido), 0) as total_valor_receber
        FROM contas_receber
      )
      SELECT 
        produtos_stats.total_produtos,
        produtos_stats.valor_total_produtos,
        pedidos_stats.total_pedidos,
        pedidos_stats.valor_total_pedidos,
        fornecedores_stats.total_fornecedores,
        pagar.total_valor_pagar,
        receber.total_valor_receber
      FROM produtos_stats, pedidos_stats, fornecedores_stats, pagar, receber
    `)

    const totals = totalsResult.rows[0]

    // Buscar dados mensais (últimos 6 meses)
    const monthlyResult = await query(`
      WITH meses AS (
        SELECT 
          to_char(date_trunc('month', current_date - (n || ' months')::interval), 'YYYY-MM') as mes,
          to_char(date_trunc('month', current_date - (n || ' months')::interval), 'MMM/YY') as mes_label
        FROM generate_series(5, 0, -1) n
      ),
      pagar_mensal AS (
        SELECT 
          to_char(data_vencimento, 'YYYY-MM') as mes,
          COALESCE(SUM(valor_liquido), 0) as total_pagar
        FROM contas_pagar
        WHERE data_vencimento >= date_trunc('month', current_date - interval '5 months')
        GROUP BY to_char(data_vencimento, 'YYYY-MM')
      ),
      receber_mensal AS (
        SELECT 
          to_char(data_vencimento, 'YYYY-MM') as mes,
          COALESCE(SUM(valor_liquido), 0) as total_receber
        FROM contas_receber
        WHERE data_vencimento >= date_trunc('month', current_date - interval '5 months')
        GROUP BY to_char(data_vencimento, 'YYYY-MM')
      )
      SELECT 
        meses.mes_label as month,
        COALESCE(pagar_mensal.total_pagar, 0) as payable,
        COALESCE(receber_mensal.total_receber, 0) as receivable
      FROM meses
      LEFT JOIN pagar_mensal ON meses.mes = pagar_mensal.mes
      LEFT JOIN receber_mensal ON meses.mes = receber_mensal.mes
      ORDER BY meses.mes
    `)

    // Buscar distribuição por unidade de medida
    const unitMeasureResult = await query(`
      SELECT 
        COALESCE(unidadeMedida, 'Não informada') as name,
        COUNT(*) as value
      FROM produtos
      GROUP BY unidadeMedida
      ORDER BY value DESC
      LIMIT 8
    `)

    // Buscar contas recentes
    const recentResult = await query(`
      (SELECT 
        id,
        codigo as code,
        fornecedor_nome as entity_name,
        data_vencimento as due_date,
        valor_liquido as value,
        CASE 
          WHEN status = 'pago' THEN 'paid'
          WHEN status = 'atrasado' THEN 'overdue'
          ELSE 'pending'
        END as status,
        'payable' as type
      FROM contas_pagar
      WHERE data_vencimento IS NOT NULL
      ORDER BY data_vencimento DESC
      LIMIT 5)
      UNION ALL
      (SELECT 
        id,
        codigo as code,
        cliente_nome as entity_name,
        data_vencimento as due_date,
        valor_liquido as value,
        CASE 
          WHEN status = 'recebido' THEN 'paid'
          WHEN status = 'atrasado' THEN 'overdue'
          ELSE 'pending'
        END as status,
        'receivable' as type
      FROM contas_receber
      WHERE data_vencimento IS NOT NULL
      ORDER BY data_vencimento DESC
      LIMIT 5)
      ORDER BY due_date DESC
      LIMIT 5
    `)

    // Cores para o gráfico de pizza
    const COLORS = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
      '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'
    ]

    return {
      totalProducts: parseInt(totals.total_produtos) || 0,
      totalProductValue: parseFloat(totals.valor_total_produtos) || 0,
      totalOrders: parseInt(totals.total_pedidos) || 0,
      totalOrderValue: parseFloat(totals.valor_total_pedidos) || 0,
      totalSuppliers: parseInt(totals.total_fornecedores) || 0,
      monthlyData: monthlyResult.rows.map((row: any) => ({
        month: row.month,
        payable: parseFloat(row.payable) || 0,
        receivable: parseFloat(row.receivable) || 0
      })),
      unitMeasureData: unitMeasureResult.rows.map((row: any, index: number) => ({
        name: row.name || 'Não informada',
        value: parseInt(row.value) || 0,
        fill: COLORS[index % COLORS.length]
      })),
      recentAccounts: recentResult.rows.map((row: any) => ({
        id: row.id,
        code: row.code || '---',
        entityName: row.entity_name || '---',
        dueDate: row.due_date,
        value: parseFloat(row.value) || 0,
        status: row.status,
        type: row.type
      }))
    }
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    throw error
  }
}