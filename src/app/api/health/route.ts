import { query } from '@/lib/pool'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rows = await query('SELECT COUNT(*) as total FROM users')
    return Response.json({
      status: 'ok',
      db: 'connected',
      users: Number(rows[0]?.total ?? 0),
      env: {
        hasDatabase: !!process.env.DATABASE_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL ?? '(not set)',
      },
    })
  } catch (err: any) {
    return Response.json({
      status: 'error',
      message: err?.message ?? String(err),
      env: {
        hasDatabase: !!process.env.DATABASE_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL ?? '(not set)',
      },
    }, { status: 500 })
  }
}
