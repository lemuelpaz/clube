import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import type { PaymentConfig } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN')
    return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const cfg = await db.getPaymentConfig()
  if (!cfg) return Response.json({ config: null })
  // Never expose clientSecret in full
  return Response.json({
    config: { ...cfg, clientSecret: cfg.clientSecret ? '••••••••' : '' },
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN')
    return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { clientId, clientSecret, sandbox } = body

  if (!clientId || !clientSecret)
    return Response.json({ error: 'clientId e clientSecret são obrigatórios' }, { status: 400 })

  const cfg: PaymentConfig = {
    provider: 'PIXUP',
    clientId,
    clientSecret,
    sandbox: !!sandbox,
    updatedAt: new Date().toISOString(),
  }

  await db.savePaymentConfig(cfg)
  return Response.json({ success: true })
}
