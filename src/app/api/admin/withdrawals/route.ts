import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN')
    return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const list = await db.getWithdrawals()
  const enriched = (await Promise.all(list.map(async w => {
    const user = await db.getUserById(w.userId)
    return { ...w, userName: user?.name ?? 'Desconhecido', userEmail: user?.email ?? '' }
  }))).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return Response.json({ withdrawals: enriched })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN')
    return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { id, action, notes } = body

  if (!id || !action) return Response.json({ error: 'id e action obrigatórios' }, { status: 400 })

  const w = await db.getWithdrawalById(id)
  if (!w) return Response.json({ error: 'Saque não encontrado' }, { status: 404 })

  const now = new Date().toISOString()
  const adminId = (session!.user as any).id

  if (action === 'approve') {
    await db.updateWithdrawal(id, { status: 'APPROVED', reviewedAt: now, reviewedBy: adminId, notes })
  } else if (action === 'reject') {
    await db.updateWithdrawal(id, { status: 'REJECTED', reviewedAt: now, reviewedBy: adminId, notes })
  } else if (action === 'mark_paid') {
    await db.updateWithdrawal(id, { status: 'PAID', reviewedAt: now, reviewedBy: adminId })
  } else {
    return Response.json({ error: 'Ação inválida' }, { status: 400 })
  }

  return Response.json({ success: true })
}
