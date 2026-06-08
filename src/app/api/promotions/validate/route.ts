import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const code = req.nextUrl.searchParams.get('code')
  const plan = req.nextUrl.searchParams.get('plan')

  if (!code || !plan)
    return Response.json({ valid: false, error: 'code e plan obrigatórios' }, { status: 400 })

  const promo = await db.getPromotionByCode(code)
  if (!promo || !promo.active)
    return Response.json({ valid: false, error: 'Cupom inválido ou inativo' })

  const now = new Date().toISOString()
  if (promo.validFrom && now < promo.validFrom)
    return Response.json({ valid: false, error: 'Cupom ainda não está ativo' })
  if (promo.validUntil && now > promo.validUntil)
    return Response.json({ valid: false, error: 'Cupom expirado' })
  if (promo.maxUses !== undefined && promo.uses >= promo.maxUses)
    return Response.json({ valid: false, error: 'Cupom esgotado' })
  if (promo.appliesTo !== 'ALL' && promo.appliesTo !== plan)
    return Response.json({ valid: false, error: `Cupom válido apenas para plano ${promo.appliesTo}` })

  const basePrice = await db.getPlanPrice(plan)
  let discountAmount: number
  let finalPrice: number

  if (promo.discountType === 'PERCENTAGE') {
    discountAmount = Math.round(basePrice * (promo.discountValue / 100) * 100) / 100
    finalPrice = Math.round((basePrice - discountAmount) * 100) / 100
  } else {
    discountAmount = Math.min(promo.discountValue, basePrice)
    finalPrice = Math.round((basePrice - discountAmount) * 100) / 100
  }

  return Response.json({
    valid: true,
    promoId: promo.id,
    code: promo.code,
    description: promo.description,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    discountAmount,
    basePrice,
    finalPrice,
  })
}
