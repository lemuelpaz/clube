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
  return Response.json({
    config: { ...cfg, clientSecret: cfg.clientSecret ? '••••••••' : '' },
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN')
    return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { provider, clientId, clientSecret, sandbox } = body

  if (!['PIXUP', 'STRIPE'].includes(provider))
    return Response.json({ error: 'Provider inválido' }, { status: 400 })

  if (provider === 'STRIPE' && !clientSecret)
    return Response.json({ error: 'Stripe Secret Key é obrigatória' }, { status: 400 })

  if (provider === 'PIXUP' && (!clientId || !clientSecret))
    return Response.json({ error: 'Client ID e Client Secret são obrigatórios' }, { status: 400 })

  // Load existing config to preserve clientSecret if blank (edit without exposing)
  const existing = await db.getPaymentConfig()
  const finalSecret =
    clientSecret && clientSecret !== '••••••••'
      ? clientSecret
      : existing?.clientSecret ?? ''

  const cfg: PaymentConfig = {
    provider,
    clientId: clientId ?? '',
    clientSecret: finalSecret,
    sandbox: !!sandbox,
    updatedAt: new Date().toISOString(),
  }

  await db.savePaymentConfig(cfg)
  return Response.json({ success: true })
}
