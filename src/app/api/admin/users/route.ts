import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { query } from '@/lib/pool'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const users = (await db.getUsers()).map(u => {
    const { password: _p, ...safe } = u
    return safe
  })

  return Response.json({ users })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { userId, action } = await req.json()
  if (!userId || !action) return Response.json({ error: 'userId e action obrigatórios' }, { status: 400 })

  const actions: Record<string, string> = {
    suspend: 'SUSPENDED', ban: 'BANNED', activate: 'ACTIVE',
  }

  if (!actions[action]) return Response.json({ error: 'Action inválida' }, { status: 400 })

  await db.updateUser(userId, { status: actions[action] as any })
  return Response.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { userId } = await req.json()
  if (!userId) return Response.json({ error: 'userId obrigatório' }, { status: 400 })

  // Guard: cannot delete another admin
  const target = await db.getUserById(userId)
  if (!target) return Response.json({ error: 'Usuário não encontrado' }, { status: 404 })
  if (target.role === 'ADMIN') return Response.json({ error: 'Não é possível excluir um admin' }, { status: 403 })

  // Single DELETE cascades to all related tables via ON DELETE CASCADE
  await query('DELETE FROM users WHERE id = $1', [userId])

  return Response.json({ success: true })
}
