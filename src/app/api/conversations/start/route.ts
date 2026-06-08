import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateId } from '@/lib/utils'
import type { Match } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as any).id
  const { targetId } = await req.json()

  if (!targetId || userId === targetId) {
    return Response.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  let match = await db.getMatchBetween(userId, targetId)
  if (!match) {
    match = {
      id: generateId(),
      user1Id: userId,
      user2Id: targetId,
      createdAt: new Date().toISOString(),
    } as Match
    await db.createMatch(match)
  }

  return Response.json({ matchId: match.id })
}
