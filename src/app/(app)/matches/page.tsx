'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, MessageCircle, MapPin, Shield, Ban } from 'lucide-react'
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

function formatLastMessage(content: string): string {
  if (content.startsWith('{')) {
    try {
      const p = JSON.parse(content)
      if (p.type === 'hot_request') return '🔥 Solicitação de Foto Exclusiva'
      if (p.type === 'hot_photo') return '📸 Envio de foto exclusiva'
    } catch {}
  }
  return content
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchData[]>([])
  const [loading, setLoading] = useState(true)
  const [blockTarget, setBlockTarget] = useState<{ id: string; name: string } | null>(null)
  const [blocking, setBlocking] = useState(false)

  useEffect(() => {
    fetch('/api/matches').then(r => r.json()).then(d => {
      if (d.matches) setMatches(d.matches)
      setLoading(false)
    })
  }, [])

  async function confirmBlock() {
    if (!blockTarget) return
    setBlocking(true)
    await fetch('/api/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockedId: blockTarget.id }),
    })
    setMatches(prev => prev.filter(m => m.user.id !== blockTarget.id))
    setBlockTarget(null)
    setBlocking(false)
  }

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
            <Link href="/discover" className="bg-gold-500 hover:bg-gold-400 text-dark-50 font-bold px-6 py-3 rounded-full text-sm transition-colors">
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
                <div key={match.id} className="group relative rounded-2xl overflow-hidden bg-dark-800 border border-dark-500 shadow-sm hover:shadow-md hover:border-gold-500/40 transition-all card-hover">
                  {/* Photo → perfil do usuário */}
                  <Link href={`/profile/${user.id}`}>
                    <div className="aspect-[3/4] relative overflow-hidden bg-dark-700">
                      {user.photos[0] ? (
                        <img
                          src={user.photos[0]}
                          alt={user.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          draggable={false}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-dark-400">
                          {user.name[0]}
                        </div>
                      )}
                      {/* Overlay escuro para legibilidade do texto */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                      {/* Verified badge */}
                      {user.verified && (
                        <div className="absolute top-2 right-2 bg-gold-500/90 rounded-full p-1">
                          <Shield size={12} className="text-dark-50" />
                        </div>
                      )}

                      {/* Unread count or online indicator */}
                      {match.unreadCount > 0 ? (
                        <div className="absolute top-2 left-2 bg-gold-500 text-dark-50 text-[10px] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5">
                          {match.unreadCount}
                        </div>
                      ) : online ? (
                        <div className="absolute top-2.5 left-2.5 w-3 h-3 rounded-full bg-green-400 border-2 border-dark-800" />
                      ) : null}

                      {/* Nome e localização sobre o overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="font-bold text-sm leading-tight text-white">
                          {user.name}{age ? `, ${age}` : ''}
                        </p>
                        {(user.city || user.state) && (
                          <p className="text-xs text-white/70 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} />
                            {[user.city, user.state].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Prévia da última mensagem + botões */}
                  <div className="p-2.5 pt-2">
                    <p className={`text-xs truncate mb-2 ${match.unreadCount > 0 ? 'text-dark-50 font-semibold' : 'text-dark-300'}`}>
                      {match.lastMessage
                        ? formatLastMessage(match.lastMessage.content)
                        : '✨ Novo match! Diga olá'}
                    </p>
                    <div className="flex gap-1.5">
                      <Link
                        href={`/messages/${match.id}`}
                        className="flex-1 py-1.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-dark-50 transition-colors flex items-center justify-center gap-1 text-xs font-bold"
                      >
                        <MessageCircle size={12} />
                        Conversar
                      </Link>
                      <button
                        onClick={() => setBlockTarget({ id: user.id, name: user.name })}
                        title="Bloquear usuário"
                        className="px-2 py-1.5 rounded-xl bg-dark-700 border border-dark-600 text-dark-300 hover:border-red-500/40 hover:text-red-400 transition-all"
                      >
                        <Ban size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Confirmação de bloqueio */}
      {blockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
          <div className="glass rounded-2xl border border-red-500/20 w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                <Ban size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-bold">Bloquear {blockTarget.name}?</h3>
                <p className="text-xs text-dark-300 mt-0.5">Este usuário não verá mais seu perfil.</p>
              </div>
            </div>
            <p className="text-sm text-dark-300 mb-5">
              Após bloquear, ele desaparecerá dos seus matches e não poderá te enviar mensagens.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setBlockTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-dark-600 text-dark-200 hover:border-dark-500 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmBlock}
                disabled={blocking}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {blocking
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Ban size={14} />Bloquear</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

