import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateId } from '@/lib/utils'
import type { Message } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as any).id
  const matchId = req.nextUrl.searchParams.get('matchId')
  if (!matchId) return Response.json({ error: 'matchId obrigatório' }, { status: 400 })

  const match = await db.getMatchById(matchId)
  if (!match) return Response.json({ error: 'Match não encontrado' }, { status: 404 })
  if (match.user1Id !== userId && match.user2Id !== userId) {
    return Response.json({ error: 'Sem permissão' }, { status: 403 })
  }

  await db.markMessagesRead(matchId, userId)
  const now = Date.now()
  const messages = (await db.getMessagesByMatch(matchId)).filter(m => {
    if (!m.expiresAt) return true
    return new Date(m.expiresAt).getTime() > now
  })
  return Response.json({ messages })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as any).id
  const role = (session.user as any).role

  // Males need active subscription
  if (role === 'MALE') {
    const sub = await db.getActiveSubscription(userId)
    if (!sub) return Response.json({ error: 'Assinatura necessária', code: 'SUBSCRIPTION_REQUIRED' }, { status: 403 })
  }

  const { matchId, content } = await req.json()
  if (!matchId || !content?.trim()) {
    return Response.json({ error: 'matchId e content obrigatórios' }, { status: 400 })
  }

  const match = await db.getMatchById(matchId)
  if (!match) return Response.json({ error: 'Match não encontrado' }, { status: 404 })
  if (match.user1Id !== userId && match.user2Id !== userId) {
    return Response.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const createdAt = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const msg: Message = {
    id: generateId(), matchId, senderId: userId,
    content: content.trim(), read: false, createdAt, expiresAt,
  }

  await db.createMessage(msg)
  return Response.json({ message: msg }, { status: 201 })
}
