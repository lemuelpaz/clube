import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateId } from '@/lib/utils'
import type { Promotion } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN')
    return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const promotions = await db.getPromotions()
  return Response.json({ promotions })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN')
    return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { code, description, discountType, discountValue, maxUses, validFrom, validUntil, appliesTo } = body

  if (!code?.trim() || !discountType || !discountValue)
    return Response.json({ error: 'code, discountType e discountValue são obrigatórios' }, { status: 400 })
  if (!['PERCENTAGE', 'FIXED'].includes(discountType))
    return Response.json({ error: 'discountType inválido' }, { status: 400 })
  if (discountType === 'PERCENTAGE' && (Number(discountValue) <= 0 || Number(discountValue) > 100))
    return Response.json({ error: 'Percentual deve ser entre 1 e 100' }, { status: 400 })

  const existing = await db.getPromotionByCode(code)
  if (existing)
    return Response.json({ error: 'Código já existe' }, { status: 409 })

  const promo: Promotion = {
    id: generateId(),
    code: code.toUpperCase().trim(),
    description: description?.trim() || undefined,
    discountType,
    discountValue: Number(discountValue),
    maxUses: maxUses ? Number(maxUses) : undefined,
    uses: 0,
    validFrom: validFrom || undefined,
    validUntil: validUntil || undefined,
    active: true,
    appliesTo: appliesTo || 'ALL',
    createdAt: new Date().toISOString(),
  }

  await db.createPromotion(promo)
  return Response.json({ promotion: promo }, { status: 201 })
}
