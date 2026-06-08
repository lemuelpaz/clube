import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateId } from '@/lib/utils'
import type { Like, Match, Earning } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as any).id
  const role = (session.user as any).role

  const FREE_MATCH_LIMIT = 10
  const [currentMatches] = await Promise.all([db.getMatchesByUser(userId)])

  if (role === 'MALE') {
    const activeSub = await db.getActiveSubscription(userId)
    if (!activeSub && currentMatches.length >= FREE_MATCH_LIMIT) {
      return Response.json({ error: 'Você usou seus 10 matches gratuitos. Assine para continuar.', code: 'MATCH_LIMIT_REACHED' }, { status: 403 })
    }
  }

  if (role === 'FEMALE') {
    const femaleUser = await db.getUserById(userId)
    if (!femaleUser?.verified && currentMatches.length >= FREE_MATCH_LIMIT) {
      return Response.json({ error: 'Verifique seu perfil para fazer mais matches.', code: 'MATCH_LIMIT_REACHED' }, { status: 403 })
    }
  }

  const { toUserId } = await req.json()
  if (!toUserId) return Response.json({ error: 'toUserId obrigatório' }, { status: 400 })

  const [target, alreadyLiked] = await Promise.all([
    db.getUserById(toUserId),
    db.hasLiked(userId, toUserId),
  ])

  if (!target) return Response.json({ error: 'Usuário não encontrado' }, { status: 404 })
  if (alreadyLiked) return Response.json({ error: 'Já curtiu este perfil' }, { status: 409 })

  const now = new Date().toISOString()
  const like: Like = { id: generateId(), fromUserId: userId, toUserId, createdAt: now }
  await db.createLike(like)

  // Credit target woman for receiving a like (R$0.50)
  if (target.role === 'FEMALE') {
    const likeEarning: Earning = {
      id: generateId(),
      userId: toUserId,
      amount: 0.50,
      type: 'LIKE_RECEIVED',
      description: 'Curtida recebida',
      fromUserId: userId,
      createdAt: now,
    }
    await db.createEarning(likeEarning)
    await db.updateUser(toUserId, { balance: (target.balance ?? 0) + 0.50 })
  }

  // Check mutual like → create match
  const mutualLike = await db.hasLiked(toUserId, userId)
  let match = null
  if (mutualLike) {
    const existing = await db.getMatchBetween(userId, toUserId)
    if (!existing) {
      const newMatch: Match = { id: generateId(), user1Id: userId, user2Id: toUserId, createdAt: now }
      match = await db.createMatch(newMatch)

      // Credit both users for match; woman earns R$2.00
      const femaleId = target.role === 'FEMALE' ? toUserId : userId
      const femaleUser = await db.getUserById(femaleId)
      if (femaleUser && femaleUser.role === 'FEMALE') {
        const matchEarning: Earning = {
          id: generateId(),
          userId: femaleId,
          amount: 2.00,
          type: 'MATCH',
          description: 'Novo match!',
          fromUserId: femaleId === toUserId ? userId : toUserId,
          createdAt: now,
        }
        await db.createEarning(matchEarning)
        await db.updateUser(femaleId, { balance: (femaleUser.balance ?? 0) + 2.00 })
      }
    }
  }

  return Response.json({ liked: true, match })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as any).id
  const { toUserId } = await req.json()

  await db.deleteLike(userId, toUserId)
  return Response.json({ unliked: true })
}
