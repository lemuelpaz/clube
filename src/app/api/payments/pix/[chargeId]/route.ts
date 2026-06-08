import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getPixChargeStatus } from '@/lib/pixup'
import { getStripePixStatus } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

// Poll endpoint — client calls every ~5s to check if PIX was paid
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chargeId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { chargeId } = await params

  const sub = await db.getSubscriptionByChargeId(chargeId)
  if (!sub) return Response.json({ error: 'Cobrança não encontrada' }, { status: 404 })

  if (sub.status === 'ACTIVE') return Response.json({ paid: true, status: 'ACTIVE' })

  const cfg = await db.getPaymentConfig()
  if (!cfg) return Response.json({ paid: false, status: sub.status })

  try {
    let result: { paid: boolean; status: string }

    if (cfg.provider === 'STRIPE') {
      result = await getStripePixStatus(cfg.clientSecret, chargeId)
    } else {
      result = await getPixChargeStatus(cfg, chargeId)
    }

    if (result.paid) {
      await db.updateSubscription(sub.id, { status: 'ACTIVE' })
      return Response.json({ paid: true, status: 'ACTIVE' })
    }
    return Response.json({ paid: false, status: result.status })
  } catch {
    return Response.json({ paid: false, status: sub.status })
  }
}
