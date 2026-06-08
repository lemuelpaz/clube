import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateId, PLAN_PRICES, PLAN_DURATIONS } from '@/lib/utils'
import type { Subscription, SubscriptionPlan } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as any).id
  const active = await db.getActiveSubscription(userId)
  const history = await db.getUserSubscriptions(userId)
  return Response.json({ active, history })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as any).id
  const role = (session.user as any).role

  if (role !== 'MALE') {
    return Response.json({ error: 'Apenas homens podem assinar' }, { status: 403 })
  }

  const { plan, paymentMethod } = await req.json() as { plan: SubscriptionPlan; paymentMethod: string }
  if (!plan || !PLAN_PRICES[plan]) {
    return Response.json({ error: 'Plano inválido' }, { status: 400 })
  }

  // Cancel current active subscription
  const current = await db.getActiveSubscription(userId)
  if (current) {
    await db.updateSubscription(current.id, { status: 'CANCELLED' })
  }

  const now = new Date()
  const endDate = new Date(now)
  endDate.setDate(endDate.getDate() + PLAN_DURATIONS[plan])

  const sub: Subscription = {
    id: generateId(),
    userId,
    plan,
    status: 'ACTIVE',
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    amount: PLAN_PRICES[plan],
    paymentMethod: paymentMethod ?? 'credit_card',
    createdAt: now.toISOString(),
  }

  await db.createSubscription(sub)
  return Response.json({ subscription: sub }, { status: 201 })
}
