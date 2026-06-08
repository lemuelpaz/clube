import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as any).id
  const role = (session.user as any).role

  if (role !== 'FEMALE') {
    return Response.json({ error: 'Apenas mulheres têm ganhos' }, { status: 403 })
  }

  const earnings = (await db.getEarningsByUser(userId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const total = earnings.reduce((s, e) => s + e.amount, 0)

  return Response.json({ earnings, total })
}
