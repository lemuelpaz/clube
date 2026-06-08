import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateId } from '@/lib/utils'
import { query } from '@/lib/pool'
import type { Block } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as any).id
  const { blockedId } = await req.json()

  if (!blockedId) return Response.json({ error: 'Dados incompletos' }, { status: 400 })
  if (userId === blockedId) return Response.json({ error: 'Inválido' }, { status: 400 })

  const already = await db.isBlocked(userId, blockedId)
  if (already) {
    await query('DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2', [userId, blockedId])
    return Response.json({ blocked: false })
  }

  const block: Block = {
    id: generateId(),
    blockerId: userId,
    blockedId,
    createdAt: new Date().toISOString(),
  }
  await db.createBlock(block)
  return Response.json({ blocked: true })
}
