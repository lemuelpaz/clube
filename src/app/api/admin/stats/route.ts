import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const users = await db.getUsers()
  const subscriptions = await db.getSubscriptions()
  const verifications = await db.getVerifications()
  const matches = await db.getMatches()
  const messages = await db.getMessages()

  const now = new Date()
  const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE' && new Date(s.endDate) > now)
  const monthlyRevenue = activeSubscriptions.reduce((sum, s) => {
    const monthlyAmount = s.plan === 'MONTHLY' ? s.amount : s.plan === 'QUARTERLY' ? s.amount / 3 : s.plan === 'SEMIANNUAL' ? s.amount / 6 : s.amount / 12
    return sum + monthlyAmount
  }, 0)

  return Response.json({
    stats: {
      totalUsers: users.filter(u => u.role !== 'ADMIN').length,
      maleUsers: users.filter(u => u.role === 'MALE').length,
      femaleUsers: users.filter(u => u.role === 'FEMALE').length,
      pendingVerifications: verifications.filter(v => v.status === 'PENDING').length,
      activeSubscriptions: activeSubscriptions.length,
      monthlyRevenue,
      totalMatches: matches.length,
      totalMessages: messages.length,
    }
  })
}
