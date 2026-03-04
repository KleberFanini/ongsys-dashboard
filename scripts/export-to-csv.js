// ongsys-dashboard/scripts/export-to-csv.js
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: '.env.local' })

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
})

const tabelas = [
    'contas_pagar',
    'contas_receber',
    'pedidos',
    'produtos',
    'fornecedores'
]

async function exportToCSV() {
    // Cria pasta de exportação
    const exportDir = path.join(__dirname, '../exports')
    if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir)
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const pastaExport = path.join(exportDir, `export-${timestamp}`)
    fs.mkdirSync(pastaExport)

    console.log(`📁 Exportando dados para: ${pastaExport}`)

    for (const tabela of tabelas) {
        try {
            console.log(`📊 Exportando ${tabela}...`)

            // Busca todos os dados da tabela
            const result = await pool.query(`SELECT * FROM ${tabela} ORDER BY id`)
            const dados = result.rows

            if (dados.length === 0) {
                console.log(`   ⚠️  Tabela ${tabela} está vazia`)
                continue
            }

            // Converte para CSV
            const colunas = Object.keys(dados[0])
            const cabecalho = colunas.join(',')

            const linhas = dados.map(row =>
                colunas.map(col => {
                    const valor = row[col]
                    // Trata valores especiais (strings com vírgula, objetos JSON, etc)
                    if (valor === null || valor === undefined) return ''
                    if (typeof valor === 'object') return `"${JSON.stringify(valor).replace(/"/g, '""')}"`
                    if (typeof valor === 'string' && (valor.includes(',') || valor.includes('"')))
                        return `"${valor.replace(/"/g, '""')}"`
                    return valor
                }).join(',')
            ).join('\n')

            const csv = `${cabecalho}\n${linhas}`

            // Salva arquivo
            const arquivo = path.join(pastaExport, `${tabela}.csv`)
            fs.writeFileSync(arquivo, csv, 'utf-8')

            console.log(`   ✅ Exportado: ${arquivo} (${dados.length} registros)`)

        } catch (error) {
            console.error(`   ❌ Erro ao exportar ${tabela}:`, error.message)
        }
    }

    console.log(`\n✅ Exportação concluída! Arquivos salvos em: ${pastaExport}`)
    process.exit(0)
}

exportToCSV().catch(console.error)