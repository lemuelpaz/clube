import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateId } from '@/lib/utils'
import type { Report } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as any).id
  const { reportedId, reason, description } = await req.json()

  if (!reportedId || !reason) {
    return Response.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  if (userId === reportedId) {
    return Response.json({ error: 'Você não pode denunciar a si mesmo' }, { status: 400 })
  }

  const report: Report = {
    id: generateId(),
    reporterId: userId,
    reportedId,
    reason,
    description: description ?? undefined,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  }

  await db.createReport(report)
  return Response.json({ success: true })
}
