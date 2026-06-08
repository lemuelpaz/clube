import pg from 'pg'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const env = fs.existsSync(envPath)
  ? Object.fromEntries(
      fs.readFileSync(envPath, 'utf-8')
        .split('\n')
        .filter(l => l.includes('=') && !l.startsWith('#'))
        .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
    )
  : {}

const DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL
if (!DATABASE_URL) { console.error('❌ DATABASE_URL not found'); process.exit(1) }

const { Pool } = pg
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })

function genId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

async function main() {
  console.log('🔌 Connecting to PostgreSQL...')
  const client = await pool.connect()

  try {
    // Create tables
    console.log('📋 Creating tables...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL,
        password TEXT NOT NULL, role TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'ACTIVE',
        cpf TEXT, phone TEXT, birth_date TEXT, city TEXT, state TEXT,
        photos TEXT[] NOT NULL DEFAULT '{}', bio TEXT, interests TEXT[] NOT NULL DEFAULT '{}',
        sugar_profile JSONB, bank_details JSONB, verified BOOLEAN NOT NULL DEFAULT FALSE,
        balance DECIMAL(12,2) NOT NULL DEFAULT 0, last_seen TEXT,
        created_at TEXT NOT NULL, updated_at TEXT,
        CONSTRAINT users_email_unique UNIQUE (email)
      );
      CREATE TABLE IF NOT EXISTS verifications (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'PENDING', document_url TEXT, selfie_url TEXT,
        notes TEXT, rejection_reason TEXT, created_at TEXT NOT NULL, reviewed_at TEXT, reviewed_by TEXT
      );
      CREATE TABLE IF NOT EXISTS likes (
        id TEXT PRIMARY KEY, from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TEXT NOT NULL,
        UNIQUE(from_user_id, to_user_id)
      );
      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY, user1_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user2_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY, match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, content TEXT NOT NULL,
        read BOOLEAN NOT NULL DEFAULT FALSE, created_at TEXT NOT NULL, expires_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan TEXT NOT NULL, status TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL, payment_method TEXT, pix_charge_id TEXT,
        pix_qr_code TEXT, pix_qr_code_text TEXT, created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS payment_config (
        id TEXT PRIMARY KEY, provider TEXT NOT NULL, client_id TEXT NOT NULL,
        client_secret TEXT NOT NULL, sandbox BOOLEAN NOT NULL DEFAULT FALSE, updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS plan_prices (
        plan TEXT PRIMARY KEY, price DECIMAL(10,2) NOT NULL, label TEXT NOT NULL, duration_days INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS promotions (
        id TEXT PRIMARY KEY, code TEXT NOT NULL, description TEXT,
        discount_type TEXT NOT NULL, discount_value DECIMAL(10,2) NOT NULL,
        max_uses INTEGER, uses INTEGER NOT NULL DEFAULT 0, valid_from TEXT, valid_until TEXT,
        active BOOLEAN NOT NULL DEFAULT TRUE, applies_to TEXT NOT NULL DEFAULT 'ALL',
        created_at TEXT NOT NULL, UNIQUE(code)
      );
      CREATE TABLE IF NOT EXISTS profile_visits (
        id TEXT PRIMARY KEY, visitor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        visited_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS favorites (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        favorite_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TEXT NOT NULL,
        UNIQUE(user_id, favorite_user_id)
      );
      CREATE TABLE IF NOT EXISTS earnings (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL, type TEXT NOT NULL, description TEXT NOT NULL,
        from_user_id TEXT, created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS withdrawal_requests (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING',
        bank_details JSONB NOT NULL, notes TEXT, created_at TEXT NOT NULL, reviewed_at TEXT, reviewed_by TEXT
      );
      CREATE TABLE IF NOT EXISTS blocks (
        id TEXT PRIMARY KEY, blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TEXT NOT NULL,
        UNIQUE(blocker_id, blocked_id)
      );
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY, reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reported_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, reason TEXT NOT NULL,
        description TEXT, status TEXT NOT NULL DEFAULT 'PENDING', created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS hot_requests (
        id TEXT PRIMARY KEY, requester_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, price DECIMAL(10,2) NOT NULL,
        message TEXT, status TEXT NOT NULL DEFAULT 'PENDING', photo_url TEXT,
        created_at TEXT NOT NULL, responded_at TEXT, paid_at TEXT
      );
    `)

    // Seed plan prices
    await client.query(`
      INSERT INTO plan_prices (plan, price, label, duration_days) VALUES
        ('MONTHLY',   149.90, 'Mensal',     30),
        ('QUARTERLY', 399.90, 'Trimestral', 90),
        ('SEMIANNUAL',699.90, 'Semestral',  180),
        ('ANNUAL',   1199.90, 'Anual',      365)
      ON CONFLICT (plan) DO NOTHING
    `)

    // Check if already seeded
    const { rows: existing } = await client.query("SELECT COUNT(*) FROM users")
    if (parseInt(existing[0].count) > 0) {
      console.log('⚠️  Banco já possui dados. Inserindo apenas novos usuários...')
    }

    const now = new Date().toISOString()
    console.log('🔐 Hashing passwords...')
    const adminHash  = await bcrypt.hash('admin123', 10)
    const maleHash   = await bcrypt.hash('senha123', 10)
    const femaleHash = await bcrypt.hash('senha123', 10)

    const users = [
      {
        id: genId(), email: 'admin@clubeelite.com', password: adminHash,
        name: 'Administrador', role: 'ADMIN', status: 'ACTIVE', verified: true,
        photos: [], interests: [], balance: 0,
      },
      {
        id: genId(), email: 'carlos@email.com', password: maleHash,
        name: 'Carlos Mendonça', role: 'MALE', status: 'ACTIVE', verified: false,
        phone: '11999990001', birth_date: '1988-05-15', city: 'São Paulo', state: 'SP',
        photos: ['https://randomuser.me/api/portraits/men/32.jpg'],
        bio: 'Empresário, amante de viagens e gastronomia. Busco conexões genuínas.',
        interests: ['Viagens', 'Gastronomia', 'Negócios', 'Golf'], balance: 0,
      },
      {
        id: genId(), email: 'roberto@email.com', password: maleHash,
        name: 'Roberto Alves', role: 'MALE', status: 'ACTIVE', verified: false,
        birth_date: '1985-09-20', city: 'Rio de Janeiro', state: 'RJ',
        photos: ['https://randomuser.me/api/portraits/men/45.jpg'],
        bio: 'Médico cirurgião. Apaixonado por esportes náuticos e gastronomia fina.',
        interests: ['Esportes', 'Viagens', 'Gastronomia', 'Mergulho'], balance: 0,
      },
      {
        id: genId(), email: 'ana@email.com', password: femaleHash,
        name: 'Ana Luiza', role: 'FEMALE', status: 'ACTIVE', verified: true,
        phone: '11999990002', birth_date: '1995-03-22', city: 'São Paulo', state: 'SP',
        photos: ['https://randomuser.me/api/portraits/women/44.jpg'],
        bio: 'Designer apaixonada por arte e moda. Amo viajar e conhecer culturas diferentes.',
        interests: ['Arte', 'Moda', 'Viagens', 'Fotografia'], balance: 2.50,
      },
      {
        id: genId(), email: 'beatriz@email.com', password: femaleHash,
        name: 'Beatriz Oliveira', role: 'FEMALE', status: 'ACTIVE', verified: true,
        phone: '11999990003', birth_date: '1992-08-10', city: 'Rio de Janeiro', state: 'RJ',
        photos: ['https://randomuser.me/api/portraits/women/68.jpg'],
        bio: 'Advogada, apaixonada por literatura e cinema. Busco conversas inteligentes.',
        interests: ['Literatura', 'Cinema', 'Teatro', 'Vinhos'], balance: 0,
      },
      {
        id: genId(), email: 'camila@email.com', password: femaleHash,
        name: 'Camila Santos', role: 'FEMALE', status: 'ACTIVE', verified: true,
        birth_date: '1997-11-05', city: 'Belo Horizonte', state: 'MG',
        photos: ['https://randomuser.me/api/portraits/women/17.jpg'],
        bio: 'Médica, amo esportes e culinária saudável. Procuro alguém com objetivos de vida.',
        interests: ['Esportes', 'Culinária', 'Yoga', 'Natureza'], balance: 0,
      },
      {
        id: genId(), email: 'daniela@email.com', password: femaleHash,
        name: 'Daniela Ferreira', role: 'FEMALE', status: 'ACTIVE', verified: true,
        birth_date: '1993-06-18', city: 'São Paulo', state: 'SP',
        photos: ['https://randomuser.me/api/portraits/women/26.jpg'],
        bio: 'Empresária no setor de moda. Vivo entre São Paulo e Milão. Apaixonada por cultura.',
        interests: ['Moda', 'Viagens', 'Gastronomia', 'Arte'], balance: 0,
      },
      {
        id: genId(), email: 'elena@email.com', password: femaleHash,
        name: 'Elena Costa', role: 'FEMALE', status: 'ACTIVE', verified: false,
        birth_date: '1990-01-30', city: 'Curitiba', state: 'PR',
        photos: ['https://randomuser.me/api/portraits/women/55.jpg'],
        bio: 'Arquiteta. Aprecio bom design, viagens e momentos únicos.',
        interests: ['Arte', 'Música', 'Viagens', 'Dança'], balance: 0,
      },
      {
        id: genId(), email: 'fernanda@email.com', password: femaleHash,
        name: 'Fernanda Lima', role: 'FEMALE', status: 'ACTIVE', verified: true,
        birth_date: '1994-04-12', city: 'São Paulo', state: 'SP',
        photos: ['https://randomuser.me/api/portraits/women/33.jpg'],
        bio: 'Nutricionista e influenciadora fitness. Adoro viagens e gastronomia saudável.',
        interests: ['Fitness', 'Nutrição', 'Viagens', 'Moda'], balance: 0,
      },
    ]

    console.log('👥 Inserting users...')
    const insertedIds = {}
    for (const u of users) {
      const res = await client.query(
        `INSERT INTO users (id,name,email,password,role,status,cpf,phone,birth_date,city,state,
          photos,bio,interests,verified,balance,last_seen,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id, email`,
        [
          u.id, u.name, u.email, u.password, u.role, u.status,
          null, u.phone ?? null, u.birth_date ?? null, u.city ?? null, u.state ?? null,
          u.photos, u.bio ?? null, u.interests,
          u.verified ?? false, u.balance ?? 0,
          now, now, now,
        ]
      )
      insertedIds[u.email] = res.rows[0]?.id ?? u.id
      process.stdout.write(`  ✓ ${u.name} (${u.role})\n`)
    }

    // Use resolved IDs (in case of ON CONFLICT)
    const adminId   = insertedIds['admin@clubeelite.com']
    const male1Id   = insertedIds['carlos@email.com']
    const male2Id   = insertedIds['roberto@email.com']
    const female1Id = insertedIds['ana@email.com']
    const female5Id = insertedIds['elena@email.com']

    // Subscription for male1
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)
    await client.query(
      `INSERT INTO subscriptions (id,user_id,plan,status,start_date,end_date,amount,payment_method,created_at)
       VALUES ($1,$2,'MONTHLY','ACTIVE',$3,$4,149.90,'credit_card',$3)
       ON CONFLICT DO NOTHING`,
      [genId(), male1Id, now, endDate.toISOString()]
    )
    console.log('  ✓ Subscription for Carlos (MONTHLY)')

    // Verifications
    await client.query(
      `INSERT INTO verifications (id,user_id,status,document_url,selfie_url,created_at,reviewed_at)
       VALUES ($1,$2,'APPROVED',$3,$4,$5,$5) ON CONFLICT DO NOTHING`,
      [
        genId(), female1Id,
        'https://via.placeholder.com/300x200?text=Documento',
        'https://via.placeholder.com/300x300?text=Selfie',
        now,
      ]
    )
    await client.query(
      `INSERT INTO verifications (id,user_id,status,document_url,selfie_url,created_at)
       VALUES ($1,$2,'PENDING',$3,$4,$5) ON CONFLICT DO NOTHING`,
      [
        genId(), female5Id,
        'https://via.placeholder.com/300x200?text=Documento',
        'https://via.placeholder.com/300x300?text=Selfie',
        now,
      ]
    )
    console.log('  ✓ Verifications seeded')

    // Match + messages between male1 and female1
    const matchId = genId()
    const msgExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    await client.query(
      `INSERT INTO matches (id,user1_id,user2_id,created_at) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
      [matchId, male1Id, female1Id, now]
    )
    await client.query(
      `INSERT INTO messages (id,match_id,sender_id,content,read,created_at,expires_at)
       VALUES ($1,$2,$3,$4,false,$5,$6) ON CONFLICT DO NOTHING`,
      [genId(), matchId, female1Id, 'Oi! Vi seu perfil e achei muito interessante 😊', now, msgExpiry]
    )
    await client.query(
      `INSERT INTO messages (id,match_id,sender_id,content,read,created_at,expires_at)
       VALUES ($1,$2,$3,$4,true,$5,$6) ON CONFLICT DO NOTHING`,
      [genId(), matchId, male1Id, 'Olá Ana! Muito prazer. Vi que você curte viagens também!', now, msgExpiry]
    )
    console.log('  ✓ Match + messages seeded')

    console.log('\n✅ Banco populado com sucesso!\n')
    console.log('┌─────────────────────────────────────────────────────┐')
    console.log('│                  CREDENCIAIS DE ACESSO               │')
    console.log('├───────────────────────┬──────────────┬──────────────┤')
    console.log('│ Usuário               │ Email                        │ Senha       │')
    console.log('├───────────────────────┼──────────────────────────────┼─────────────┤')
    console.log('│ Admin                 │ admin@clubeelite.com         │ admin123    │')
    console.log('│ Carlos (Homem)        │ carlos@email.com             │ senha123    │')
    console.log('│ Roberto (Homem)       │ roberto@email.com            │ senha123    │')
    console.log('│ Ana (Mulher ✓)        │ ana@email.com                │ senha123    │')
    console.log('│ Beatriz (Mulher ✓)    │ beatriz@email.com            │ senha123    │')
    console.log('│ Camila (Mulher ✓)     │ camila@email.com             │ senha123    │')
    console.log('│ Daniela (Mulher ✓)    │ daniela@email.com            │ senha123    │')
    console.log('│ Elena (Mulher ✗)      │ elena@email.com              │ senha123    │')
    console.log('│ Fernanda (Mulher ✓)   │ fernanda@email.com           │ senha123    │')
    console.log('└───────────────────────┴──────────────────────────────┴─────────────┘')

  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(err => { console.error('❌ Error:', err.message); process.exit(1) })
