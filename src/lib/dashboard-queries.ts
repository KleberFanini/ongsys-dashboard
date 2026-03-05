import { query } from './db'
import { DashboardSummary, MonthlyData, RecentAccount } from './dashboard-types'

export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    // 1. Buscar totais - AJUSTADO para nova estrutura de produtos
    const totalsResult = await query(`
      WITH pagar AS (
        SELECT 
          COALESCE(COUNT(*), 0) as total_contas_pagar,
          COALESCE(SUM(valor_liquido), 0) as total_valor_pagar
        FROM contas_pagar
      ),
      receber AS (
        SELECT 
          COALESCE(COUNT(*), 0) as total_contas_receber,
          COALESCE(SUM(valor_liquido), 0) as total_valor_receber
        FROM contas_receber
      ),
      fornecedores AS (
        SELECT COALESCE(COUNT(*), 0) as total FROM fornecedores
      ),
      produtos AS (
        SELECT 
          COALESCE(COUNT(*), 0) as total
          -- Removido estoque_atual pois não existe mais
        FROM produtos
      )
      SELECT 
        fornecedores.total as total_fornecedores,
        produtos.total as total_produtos,
        0 as produtos_baixo_estoque, -- Valor fixo já que não temos estoque
        pagar.total_valor_pagar as total_pagar,
        receber.total_valor_receber as total_receber
      FROM pagar, receber, fornecedores, produtos
    `)

    const totals = totalsResult.rows[0]

    // 2. Buscar dados mensais (últimos 6 meses)
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

    // 3. Buscar status das contas
    const statusResult = await query(`
      SELECT 
        'Pendentes' as name,
        COUNT(*) as value,
        'pendente' as status
      FROM (
        SELECT status FROM contas_pagar WHERE status = 'pendente'
        UNION ALL
        SELECT status FROM contas_receber WHERE status = 'pendente'
      ) contas
      UNION ALL
      SELECT 
        'Vencidas' as name,
        COUNT(*) as value,
        'vencido' as status
      FROM (
        SELECT status FROM contas_pagar WHERE status = 'atrasado'
        UNION ALL
        SELECT status FROM contas_receber WHERE status = 'atrasado'
      ) contas
      UNION ALL
      SELECT 
        'Pagas/Recebidas' as name,
        COUNT(*) as value,
        'quitado' as status
      FROM (
        SELECT status FROM contas_pagar WHERE status = 'pago'
        UNION ALL
        SELECT status FROM contas_receber WHERE status = 'recebido'
      ) contas
    `)

    // 4. Buscar contas recentes
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
      '#f59e0b',
      '#ef4444',
      '#10b981'
    ]

    return {
      totalSuppliers: parseInt(totals.total_fornecedores) || 0,
      totalProducts: parseInt(totals.total_produtos) || 0,
      lowStockProducts: 0,
      totalPayable: parseFloat(totals.total_pagar) || 0,
      totalReceivable: parseFloat(totals.total_receber) || 0,
      monthlyData: monthlyResult.rows.map((row: any) => ({
        month: row.month,
        payable: parseFloat(row.payable) || 0,
        receivable: parseFloat(row.receivable) || 0
      })),
      statusData: statusResult.rows.map((row: any, index: number) => ({
        name: row.name,
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