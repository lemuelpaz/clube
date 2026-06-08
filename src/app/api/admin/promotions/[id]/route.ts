import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN')
    return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const promo = await db.getPromotionById(id)
  if (!promo) return Response.json({ error: 'Promoção não encontrada' }, { status: 404 })

  const allowed = ['active', 'description', 'discountType', 'discountValue', 'maxUses', 'validFrom', 'validUntil', 'appliesTo']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const updated = await db.updatePromotion(id, updates)
  return Response.json({ promotion: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN')
    return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  await db.deletePromotion(id)
  return Response.json({ success: true })
}
