import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { createPixCharge } from '@/lib/pixup'
import { createStripePixCharge } from '@/lib/stripe'
import { generateId, PLAN_DURATIONS } from '@/lib/utils'
import type { Subscription } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const user = session.user as any
  if (user.role !== 'MALE')
    return Response.json({ error: 'Apenas assinantes masculinos' }, { status: 403 })

  const body = await req.json()
  const { plan, promoCode } = body as { plan: string; promoCode?: string }

  if (!['MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL'].includes(plan))
    return Response.json({ error: 'Plano inválido' }, { status: 400 })

  const [cfg, fullUser] = await Promise.all([
    db.getPaymentConfig(),
    db.getUserById(user.id),
  ])
  if (!cfg || !cfg.clientSecret)
    return Response.json({ error: 'Gateway de pagamento não configurado. Contate o suporte.' }, { status: 503 })
  if (!fullUser) return Response.json({ error: 'Usuário não encontrado' }, { status: 404 })

  // Fetch price from DB
  let basePrice = await db.getPlanPrice(plan)
  let finalAmount = basePrice
  let promoId: string | undefined

  if (promoCode?.trim()) {
    const now = new Date().toISOString()
    const promo = await db.getPromotionByCode(promoCode)
    const isValid =
      promo &&
      promo.active &&
      (promo.appliesTo === 'ALL' || promo.appliesTo === plan) &&
      (!promo.validFrom || now >= promo.validFrom) &&
      (!promo.validUntil || now <= promo.validUntil) &&
      (promo.maxUses === undefined || promo.uses < promo.maxUses)

    if (isValid && promo) {
      if (promo.discountType === 'PERCENTAGE') {
        finalAmount = Math.round(basePrice * (1 - promo.discountValue / 100) * 100) / 100
      } else {
        finalAmount = Math.max(0, Math.round((basePrice - promo.discountValue) * 100) / 100)
      }
      promoId = promo.id
    }
  }

  const subId = generateId()

  try {
    let charge: { chargeId: string; qrCodeImage?: string; qrCodeText: string; expiresAt?: string }

    if (cfg.provider === 'STRIPE') {
      const origin = req.headers.get('origin') ?? 'https://localhost:3000'
      charge = await createStripePixCharge(cfg.clientSecret, {
        amount: finalAmount,
        externalId: subId,
        description: `Clube Elite - Plano ${plan}`,
        returnUrl: `${origin}/subscription`,
      })
    } else {
      if (!cfg.clientId)
        return Response.json({ error: 'Gateway de pagamento não configurado. Contate o suporte.' }, { status: 503 })
      charge = await createPixCharge(cfg, {
        amount: finalAmount,
        externalId: subId,
        customer: {
          name: fullUser.name,
          cpf: fullUser.cpf ?? '00000000000',
          email: fullUser.email,
        },
        description: `Clube Elite - Plano ${plan}`,
        expirationSeconds: 3600,
      })
    }

    const now = new Date().toISOString()
    const days = PLAN_DURATIONS[plan]
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

    const sub: Subscription = {
      id: subId,
      userId: user.id,
      plan: plan as any,
      status: 'PENDING_PAYMENT',
      startDate: now,
      endDate,
      amount: finalAmount,
      paymentMethod: 'PIX',
      pixChargeId: charge.chargeId,
      pixQrCode: charge.qrCodeImage,
      pixQrCodeText: charge.qrCodeText,
      createdAt: now,
    }

    await db.createSubscription(sub)
    if (promoId) await db.incrementPromotionUses(promoId)

    return Response.json({
      subscriptionId: subId,
      chargeId: charge.chargeId,
      qrCodeImage: charge.qrCodeImage,
      qrCodeText: charge.qrCodeText,
      expiresAt: charge.expiresAt,
      amount: finalAmount,
      basePrice,
      discount: basePrice - finalAmount,
    })
  } catch (err: any) {
    console.error('Payment error:', err)
    return Response.json({ error: err.message ?? 'Erro ao gerar PIX' }, { status: 502 })
  }
}
