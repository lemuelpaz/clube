'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, MessageCircle, MapPin, Shield } from 'lucide-react'
import { calculateAge, timeAgo, isOnline } from '@/lib/utils'

interface MatchData {
  id: string
  user1Id: string
  user2Id: string
  createdAt: string
  user: {
    id: string
    name: string
    photos: string[]
    birthDate?: string
    city?: string
    state?: string
    verified: boolean
    lastSeen?: string
  }
  lastMessage: { content: string; createdAt: string; senderId: string } | null
  unreadCount: number
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/matches').then(r => r.json()).then(d => {
      if (d.matches) setMatches(d.matches)
      setLoading(false)
    })
  }, [])

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-lg border-b border-dark-700 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">Matches</h1>
          <div className="text-sm text-dark-300">{matches.length} match{matches.length !== 1 ? 'es' : ''}</div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-dark-800 animate-pulse" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-24">
            <Heart size={48} className="mx-auto mb-4 text-dark-600" />
            <h2 className="text-lg font-bold mb-2">Nenhum match ainda</h2>
            <p className="text-dark-300 text-sm mb-6">Curta perfis para fazer match quando houver interesse mútuo</p>
            <Link href="/discover" className="bg-gold-500 hover:bg-gold-400 text-dark-900 font-bold px-6 py-3 rounded-full text-sm transition-colors">
              Descobrir Perfis
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {matches.map(match => {
              const { user } = match
              const age = user.birthDate ? calculateAge(user.birthDate) : null
              const online = isOnline(user.lastSeen)
              return (
                <div key={match.id} className="group relative rounded-2xl overflow-hidden bg-dark-800 border border-dark-600 hover:border-gold-500/30 transition-all card-hover">
                  <Link href={`/messages/${match.id}`}>
                    <div className="aspect-[3/4] relative overflow-hidden bg-dark-700">
                      {user.photos[0] ? (
                        <img
                          src={user.photos[0]}
                          alt={user.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          draggable={false}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-dark-500">
                          {user.name[0]}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-transparent to-transparent" />

                      {/* Verified badge */}
                      {user.verified && (
                        <div className="absolute top-2 right-2 bg-gold-500/90 rounded-full p-1">
                          <Shield size={12} className="text-dark-900" />
                        </div>
                      )}

                      {/* Unread count or online indicator */}
                      {match.unreadCount > 0 ? (
                        <div className="absolute top-2 left-2 bg-gold-500 text-dark-900 text-[10px] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5">
                          {match.unreadCount}
                        </div>
                      ) : online ? (
                        <div className="absolute top-2.5 left-2.5 w-3 h-3 rounded-full bg-green-400 border-2 border-dark-800" />
                      ) : null}

                      {/* Name / location overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="font-bold text-sm leading-tight">
                          {user.name}{age ? `, ${age}` : ''}
                        </p>
                        {(user.city || user.state) && (
                          <p className="text-xs text-dark-200 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} />
                            {[user.city, user.state].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Last message preview + chat button */}
                  <div className="p-2.5 pt-2">
                    <p className={`text-xs truncate mb-2 ${match.unreadCount > 0 ? 'text-white font-medium' : 'text-dark-400'}`}>
                      {match.lastMessage
                        ? match.lastMessage.content
                        : '✨ Novo match! Diga olá'}
                    </p>
                    <Link
                      href={`/messages/${match.id}`}
                      className="w-full py-1.5 rounded-xl bg-gold-500/15 text-gold-400 hover:bg-gold-500/25 transition-colors flex items-center justify-center gap-1.5 text-xs font-medium"
                    >
                      <MessageCircle size={13} />
                      Conversar
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
