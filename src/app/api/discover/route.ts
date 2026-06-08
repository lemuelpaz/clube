import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { calculateAge } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as any).id
  const role = (session.user as any).role

  const url = req.nextUrl
  const minAge = parseInt(url.searchParams.get('minAge') ?? '18')
  const maxAge = parseInt(url.searchParams.get('maxAge') ?? '60')
  const state = url.searchParams.get('state') ?? ''
  const city = url.searchParams.get('city') ?? ''
  const onlyVerified = url.searchParams.get('verified') === 'true'

  const allUsers = await db.getUsers()
  const blocked = await db.getBlockedIds(userId)
  const liked = (await db.getLikesByUser(userId)).map(l => l.toUserId)

  // Male users see female profiles, female users see male profiles
  const targetRole = role === 'MALE' ? 'FEMALE' : 'MALE'

  let profiles = allUsers.filter(u => {
    if (u.id === userId) return false
    if (u.role !== targetRole) return false
    if (u.status !== 'ACTIVE') return false
    if (u.hidden) return false
    if (blocked.includes(u.id)) return false
    if (role === 'FEMALE' && !onlyVerified) return true
    if (role === 'MALE' && !u.verified) return false // males only see verified females
    return true
  })

  // Apply filters
  if (state) profiles = profiles.filter(u => u.state === state)
  if (city) profiles = profiles.filter(u => u.city?.toLowerCase().includes(city.toLowerCase()))
  if (onlyVerified) profiles = profiles.filter(u => u.verified)
  profiles = profiles.filter(u => {
    if (!u.birthDate) return true
    const age = calculateAge(u.birthDate)
    return age >= minAge && age <= maxAge
  })

  // Sort: not yet liked first, then by lastSeen
  profiles.sort((a, b) => {
    const aLiked = liked.includes(a.id) ? 1 : 0
    const bLiked = liked.includes(b.id) ? 1 : 0
    if (aLiked !== bLiked) return aLiked - bLiked
    const aTime = a.lastSeen ? new Date(a.lastSeen).getTime() : 0
    const bTime = b.lastSeen ? new Date(b.lastSeen).getTime() : 0
    return bTime - aTime
  })

  const result = profiles.map(u => {
    const { password: _p, ...safe } = u
    return { ...safe, hasLiked: liked.includes(u.id) }
  })

  return Response.json({ profiles: result })
}
