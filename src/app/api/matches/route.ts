import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as any).id
  await db.updateUser(userId, { lastSeen: new Date().toISOString() })
  const matches = await db.getMatchesByUser(userId)

  const enriched = (await Promise.all(matches.map(async match => {
    const otherId = match.user1Id === userId ? match.user2Id : match.user1Id
    const other = await db.getUserById(otherId)
    if (!other) return null

    const messages = await db.getMessagesByMatch(match.id)
    const lastMsg = messages[messages.length - 1] ?? null
    const unread = messages.filter(m => m.senderId !== userId && !m.read).length

    const { password: _p, ...safeUser } = other
    return { ...match, user: safeUser, lastMessage: lastMsg, unreadCount: unread }
  }))).filter(Boolean)

  // Sort by last message time
  enriched.sort((a, b) => {
    const aTime = a!.lastMessage ? new Date(a!.lastMessage.createdAt).getTime() : new Date(a!.createdAt).getTime()
    const bTime = b!.lastMessage ? new Date(b!.lastMessage.createdAt).getTime() : new Date(b!.createdAt).getTime()
    return bTime - aTime
  })

  return Response.json({ matches: enriched })
}
