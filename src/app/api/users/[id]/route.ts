import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const user = await db.getUserById(id)
  if (!user) return Response.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const { password: _p, ...safe } = user

  // Track visit if viewing someone else's profile
  const viewerId = (session.user as any).id
  if (viewerId !== id) {
    const { generateId } = await import('@/lib/utils')
    await db.createProfileVisit({
      id: generateId(), visitorId: viewerId, visitedId: id,
      createdAt: new Date().toISOString(),
    })
  }

  return Response.json({ user: safe })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const userId = (session.user as any).id
  const role = (session.user as any).role

  if (userId !== id && role !== 'ADMIN') {
    return Response.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json()
  const allowed = ['name', 'phone', 'birthDate', 'city', 'state', 'bio', 'interests', 'photos', 'hidden']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const updated = await db.updateUser(id, updates)
  if (!updated) return Response.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const { password: _p, ...safe } = updated
  return Response.json({ user: safe })
}
