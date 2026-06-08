import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateId, formatCurrency } from '@/lib/utils'
import type { HotRequest, Earning } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as any).id
  const role = (session.user as any).role

  if (role === 'MALE') {
    const rawRequests = await db.getHotRequestsByRequester(userId)
    const requests = await Promise.all(rawRequests.map(async r => {
      const target = await db.getUserById(r.targetId)
      return { ...r, targetName: target?.name, targetPhoto: target?.photos?.[0] }
    }))
    return Response.json({ requests })
  }

  if (role === 'FEMALE') {
    const rawRequests = await db.getHotRequestsByTarget(userId)
    const requests = await Promise.all(rawRequests.map(async r => {
      const requester = await db.getUserById(r.requesterId)
      return { ...r, requesterName: requester?.name, requesterPhoto: requester?.photos?.[0] }
    }))
    return Response.json({ requests })
  }

  return Response.json({ requests: [] })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as any).id
  const role = (session.user as any).role

  if (role !== 'MALE') {
    return Response.json({ error: 'Apenas homens podem solicitar fotos' }, { status: 403 })
  }

  const sub = await db.getActiveSubscription(userId)
  if (!sub) return Response.json({ error: 'Assinatura necessária', code: 'SUBSCRIPTION_REQUIRED' }, { status: 403 })

  const { targetId, price, message } = await req.json()
  if (!targetId || !price) return Response.json({ error: 'targetId e price obrigatórios' }, { status: 400 })

  const target = await db.getUserById(targetId)
  if (!target || target.role !== 'FEMALE') {
    return Response.json({ error: 'Destinatário inválido' }, { status: 404 })
  }

  const request: HotRequest = {
    id: generateId(),
    requesterId: userId,
    targetId,
    price: Number(price),
    message: message?.trim(),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  }

  await db.createHotRequest(request)
  return Response.json({ request }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as any).id
  const role = (session.user as any).role

  const { requestId, action, photoUrl } = await req.json()
  if (!requestId || !action) return Response.json({ error: 'requestId e action obrigatórios' }, { status: 400 })

  const hotReq = await db.getHotRequestById(requestId)
  if (!hotReq) return Response.json({ error: 'Solicitação não encontrada' }, { status: 404 })

  const now = new Date().toISOString()

  // Female: accept, reject, or send photo
  if (role === 'FEMALE') {
    if (hotReq.targetId !== userId) return Response.json({ error: 'Sem permissão' }, { status: 403 })

    if (action === 'accept') {
      const updated = await db.updateHotRequest(requestId, { status: 'ACCEPTED', respondedAt: now })
      return Response.json({ request: updated })
    }
    if (action === 'reject') {
      const updated = await db.updateHotRequest(requestId, { status: 'REJECTED', respondedAt: now })
      return Response.json({ request: updated })
    }
    if (action === 'send_photo') {
      if (!photoUrl) return Response.json({ error: 'photoUrl obrigatório' }, { status: 400 })
      const updated = await db.updateHotRequest(requestId, { status: 'PHOTO_SENT', photoUrl, respondedAt: now })
      return Response.json({ request: updated })
    }
  }

  // Male: pay to unlock
  if (role === 'MALE') {
    if (hotReq.requesterId !== userId) return Response.json({ error: 'Sem permissão' }, { status: 403 })
    if (action === 'pay') {
      if (hotReq.status !== 'PHOTO_SENT') {
        return Response.json({ error: 'Foto ainda não enviada' }, { status: 400 })
      }
      const updated = await db.updateHotRequest(requestId, { status: 'PAID', paidAt: now })

      // Credit woman 60% of the price
      const woman = await db.getUserById(hotReq.targetId)
      if (woman) {
        const earned = Math.round(hotReq.price * 0.6 * 100) / 100
        const earning: Earning = {
          id: generateId(),
          userId: hotReq.targetId,
          amount: earned,
          type: 'HOT_PHOTO_SOLD',
          description: `Foto hot vendida por ${formatCurrency(hotReq.price)}`,
          fromUserId: userId,
          createdAt: now,
        }
        await db.createEarning(earning)
        await db.updateUser(hotReq.targetId, { balance: (woman.balance ?? 0) + earned })
      }

      return Response.json({ request: updated })
    }
  }

  return Response.json({ error: 'Ação inválida' }, { status: 400 })
}
