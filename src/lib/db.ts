// ongsys-dashboard/src/lib/db.ts
import { Pool } from 'pg'

// Verifica se todas as variáveis de ambiente estão presentes
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ Variável de ambiente ${envVar} não definida`)
    }
}

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20, // número máximo de conexões no pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
})

// Testa a conexão
pool.on('connect', () => {
    console.log('✅ Conectado ao PostgreSQL')
})

pool.on('error', (err) => {
    console.error('❌ Erro inesperado no pool de conexões', err)
})

export async function query(text: string, params?: any[]) {
    const start = Date.now()
    try {
        const res = await pool.query(text, params)
        const duration = Date.now() - start
        console.log('📊 Query executada', {
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            duration: `${duration}ms`,
            rows: res.rowCount
        })
        return res
    } catch (error) {
        console.error('❌ Erro executando query:', error)
        throw error
    }
}

// Para usar em API Routes
export default pool