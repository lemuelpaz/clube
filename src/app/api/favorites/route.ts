import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateId } from '@/lib/utils'
import type { Favorite } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as any).id
  const favs = await db.getFavorites(userId)
  const profiles = (await Promise.all(favs.map(async f => {
    const user = await db.getUserById(f.favoriteUserId)
    if (!user) return null
    const { password: _p, ...safe } = user
    return safe
  }))).filter(Boolean)

  return Response.json({ favorites: profiles })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as any).id
  const { favoriteUserId } = await req.json()

  if (await db.isFavorite(userId, favoriteUserId)) {
    await db.deleteFavorite(userId, favoriteUserId)
    return Response.json({ favorited: false })
  }

  const fav: Favorite = {
    id: generateId(), userId, favoriteUserId, createdAt: new Date().toISOString(),
  }
  await db.createFavorite(fav)
  return Response.json({ favorited: true })
}
