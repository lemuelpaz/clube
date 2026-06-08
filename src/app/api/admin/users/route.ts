import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

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
