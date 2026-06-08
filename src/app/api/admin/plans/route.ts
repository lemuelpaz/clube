import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN')
    return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const prices = await db.getPlanPrices()
  return Response.json({ prices })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN')
    return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const validPlans = ['MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL']
  const updates = Object.entries(body as Record<string, number>).filter(([k]) => validPlans.includes(k))

  await Promise.all(updates.map(([plan, price]) => db.updatePlanPrice(plan, Number(price))))

  const prices = await db.getPlanPrices()
  return Response.json({ success: true, prices })
}
