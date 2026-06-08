import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

function requireAdmin(role: string) { return role !== 'ADMIN' }

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || requireAdmin((session.user as any).role)) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const reports = await db.getReports()

  const enriched = await Promise.all(reports.map(async r => {
    const [reporter, reported] = await Promise.all([
      db.getUserById(r.reporterId),
      db.getUserById(r.reportedId),
    ])
    return {
      ...r,
      reporter: reporter ? { id: reporter.id, name: reporter.name, email: reporter.email, photos: reporter.photos } : null,
      reported: reported ? { id: reported.id, name: reported.name, email: reported.email, photos: reported.photos, role: reported.role } : null,
    }
  }))

  // Newest first
  enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return Response.json({ reports: enriched })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || requireAdmin((session.user as any).role)) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { reportId, action } = await req.json()
  if (!reportId || !action) return Response.json({ error: 'reportId e action obrigatórios' }, { status: 400 })

  const validActions = ['resolve', 'dismiss']
  if (!validActions.includes(action)) return Response.json({ error: 'Action inválida' }, { status: 400 })

  const statusMap: Record<string, string> = { resolve: 'RESOLVED', dismiss: 'DISMISSED' }
  await db.updateReport(reportId, { status: statusMap[action] })

  return Response.json({ success: true })
}
