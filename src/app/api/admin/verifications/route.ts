import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

function requireAdmin(role: string) {
  return role !== 'ADMIN'
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || requireAdmin((session.user as any).role)) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const verifications = await db.getVerifications()
  const enriched = await Promise.all(verifications.map(async v => {
    const user = await db.getUserById(v.userId)
    return { ...v, user: user ? { id: user.id, name: user.name, email: user.email, photos: user.photos } : null }
  }))

  return Response.json({ verifications: enriched })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || requireAdmin((session.user as any).role)) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id, action, rejectionReason } = await req.json()
  if (!id || !action) return Response.json({ error: 'id e action obrigatórios' }, { status: 400 })

  const now = new Date().toISOString()
  const verifs = await db.getVerifications()
  const verif = verifs.find(v => v.id === id)
  if (!verif) return Response.json({ error: 'Verificação não encontrada' }, { status: 404 })

  if (action === 'approve') {
    await db.updateVerification(id, { status: 'APPROVED', reviewedAt: now })
    await db.updateUser(verif.userId, { verified: true })
  } else if (action === 'reject') {
    await db.updateVerification(id, { status: 'REJECTED', reviewedAt: now, rejectionReason })
    await db.updateUser(verif.userId, { verified: false })
  } else {
    return Response.json({ error: 'Action inválida' }, { status: 400 })
  }

  return Response.json({ success: true })
}
