import pg from 'pg'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

async function main() {
  const client = await pool.connect()
  try {
    const hash = await bcrypt.hash('admin@2024', 10)
    const now = new Date().toISOString()

    const res = await client.query(
      `INSERT INTO users (id, name, email, password, role, status, photos, interests, verified, balance, created_at, updated_at, last_seen)
       VALUES ($1, 'Administrador', 'admin@clubeelite.com', $2, 'ADMIN', 'ACTIVE', '{}', '{}', true, 0, $3, $3, $3)
       ON CONFLICT (email) DO UPDATE SET
         password = EXCLUDED.password,
         role = 'ADMIN',
         status = 'ACTIVE'
       RETURNING email, role`,
      [randomUUID(), hash, now]
    )

    console.log('✅ Admin criado/atualizado:', res.rows[0])
    console.log('   Email: admin@clubeelite.com')
    console.log('   Senha: admin@2024')
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(console.error)
