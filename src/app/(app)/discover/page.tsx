'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
  Heart, Star, MapPin, Shield, SlidersHorizontal, LayoutGrid, Play,
  ChevronUp, ChevronDown, Crown, Info, X
} from 'lucide-react'
import { calculateAge, STATES } from '@/lib/utils'
import Link from 'next/link'

interface Profile {
  id: string
  name: string
  photos: string[]
  birthDate?: string
  city?: string
  state?: string
  bio?: string
  interests?: string[]
  verified: boolean
  lastSeen?: string
  hasLiked: boolean
}

export default function DiscoverPage() {
  const { data: session } = useSession()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set())
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [limitModal, setLimitModal] = useState<'subscription' | 'verification' | null>(null)
  const [viewMode, setViewMode] = useState<'feed' | 'grid'>('feed')
  const [filters, setFilters] = useState({ state: '', city: '', minAge: 18, maxAge: 60 })

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      state: filters.state, minAge: String(filters.minAge), maxAge: String(filters.maxAge),
    })
    const res = await fetch(`/api/discover?${params}`)
    const data = await res.json()
    if (data.profiles) {
      setProfiles(data.profiles)
      setLikedIds(new Set(data.profiles.filter((p: Profile) => p.hasLiked).map((p: Profile) => p.id)))
    }
    setSkippedIds(new Set())
    setLoading(false)
  }, [filters])

  useEffect(() => { load() }, [load])

  async function handleLike(profileId: string) {
    if (likedIds.has(profileId)) return
    setLikedIds(prev => new Set([...prev, profileId]))
    const res = await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toUserId: profileId }),
    })
    const data = await res.json()
    if (data.code === 'MATCH_LIMIT_REACHED') {
      const role = (session?.user as any)?.role
      setLimitModal(role === 'MALE' ? 'subscription' : 'verification')
      return
    }
    if (data.match) {
      const p = profiles.find(x => x.id === profileId)
      if (p) setMatchedProfile(p)
    }
  }

  async function handleFavorite(profileId: string) {
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favoriteUserId: profileId }),
    })
  }

  const visible = profiles.filter(p =>
    !skippedIds.has(p.id) &&
    (!filters.city || p.city?.toLowerCase().includes(filters.city.toLowerCase()))
  )

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="shrink-0 z-30 bg-dark-900/90 backdrop-blur-lg border-b border-dark-700 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <h1 className="text-lg font-bold">Descobrir</h1>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl overflow-hidden border border-dark-600">
              <button
                onClick={() => setViewMode('feed')}
                className={`p-2 transition-colors ${viewMode === 'feed' ? 'bg-gold-500/20 text-gold-400' : 'bg-dark-800 text-dark-300 hover:text-white'}`}
                title="Feed TikTok"
              >
                <Play size={15} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-gold-500/20 text-gold-400' : 'bg-dark-800 text-dark-300 hover:text-white'}`}
                title="Grade"
              >
                <LayoutGrid size={15} />
              </button>
            </div>
            <button
              onClick={() => setShowFilters(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-colors ${showFilters ? 'bg-gold-500/10 border-gold-500/40 text-gold-400' : 'bg-dark-800 border-dark-600 text-dark-100 hover:border-gold-500/40'}`}
            >
              <SlidersHorizontal size={14} />
              Filtros
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="max-w-2xl mx-auto mt-3 p-4 bg-dark-800 rounded-xl border border-dark-600 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-dark-300 mb-1 block">Estado</label>
              <select value={filters.state} onChange={e => setFilters(f => ({ ...f, state: e.target.value }))}
                className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500/50">
                <option value="">Todos</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-dark-300 mb-1 block">Cidade</label>
              <input value={filters.city} onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
                placeholder="Ex: São Paulo"
                className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-gold-500/50" />
            </div>
            <div>
              <label className="text-xs text-dark-300 mb-1 block">Idade mín: {filters.minAge}</label>
              <input type="range" min={18} max={60} value={filters.minAge}
                onChange={e => setFilters(f => ({ ...f, minAge: Number(e.target.value) }))}
                className="w-full accent-gold-500" />
            </div>
            <div>
              <label className="text-xs text-dark-300 mb-1 block">Idade máx: {filters.maxAge}</label>
              <input type="range" min={18} max={70} value={filters.maxAge}
                onChange={e => setFilters(f => ({ ...f, maxAge: Number(e.target.value) }))}
                className="w-full accent-gold-500" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
          </div>
        ) : viewMode === 'feed' ? (
          <TikTokFeed
            profiles={visible}
            likedIds={likedIds}
            onLike={handleLike}
            onFavorite={handleFavorite}
            onReload={load}
          />
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="max-w-6xl mx-auto p-4 pb-20 md:pb-6">
              {visible.length === 0 ? (
                <div className="text-center py-24 text-dark-300">
                  <Heart size={48} className="mx-auto mb-4 opacity-30" />
                  <p>Nenhum perfil encontrado com esses filtros.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {visible.map(profile => (
                    <GridCard
                      key={profile.id}
                      profile={profile}
                      liked={likedIds.has(profile.id)}
                      onLike={() => handleLike(profile.id)}
                      onFavorite={() => handleFavorite(profile.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Match limit modal */}
      {limitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass rounded-2xl p-8 border border-gold-500/20 text-center max-w-sm w-full">
            <div className="text-5xl mb-4">{limitModal === 'subscription' ? '👑' : '🔒'}</div>
            {limitModal === 'subscription' ? (
              <>
                <h2 className="text-xl font-bold mb-2">10 matches gratuitos usados</h2>
                <p className="text-dark-200 text-sm mb-6">Assine o Clube Elite para ter matches ilimitados e ver todas as mensagens que você recebeu.</p>
                <div className="flex gap-3">
                  <button onClick={() => setLimitModal(null)} className="flex-1 py-2.5 rounded-xl border border-dark-500 text-sm text-dark-300 hover:text-white transition-colors">Depois</button>
                  <Link href="/subscription" onClick={() => setLimitModal(null)} className="flex-1 bg-gold-500 hover:bg-gold-400 text-dark-900 font-bold py-2.5 rounded-xl text-sm text-center transition-colors">
                    Assinar agora
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-2">10 matches gratuitos usados</h2>
                <p className="text-dark-200 text-sm mb-6">Verifique seu perfil para continuar fazendo matches e para ler as mensagens recebidas.</p>
                <div className="flex gap-3">
                  <button onClick={() => setLimitModal(null)} className="flex-1 py-2.5 rounded-xl border border-dark-500 text-sm text-dark-300 hover:text-white transition-colors">Depois</button>
                  <Link href="/verification" onClick={() => setLimitModal(null)} className="flex-1 bg-gold-500 hover:bg-gold-400 text-dark-900 font-bold py-2.5 rounded-xl text-sm text-center transition-colors">
                    Verificar perfil
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Match modal */}
      {matchedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass rounded-2xl p-10 border border-gold-500/30 text-center max-w-sm mx-4 gold-glow">
            <div className="text-6xl mb-4">💛</div>
            <h2 className="text-2xl font-bold mb-2 text-gradient-gold">É um Match!</h2>
            <p className="text-dark-200 mb-6">Você e {matchedProfile.name} se curtiram!</p>
            <div className="flex gap-3">
              <button onClick={() => setMatchedProfile(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-dark-500 text-sm font-medium hover:bg-dark-700 transition-colors">
                Continuar
              </button>
              <Link href="/matches" onClick={() => setMatchedProfile(null)}
                className="flex-1 bg-gold-500 hover:bg-gold-400 text-dark-900 px-4 py-3 rounded-xl text-sm font-bold text-center transition-colors">
                Enviar Mensagem
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── TIKTOK FEED ───────────────────────────────────────────────────────────────

function TikTokFeed({ profiles, likedIds, onLike, onFavorite, onReload }: {
  profiles: Profile[]
  likedIds: Set<string>
  onLike: (id: string) => void
  onFavorite: (id: string) => void
  onReload: () => void
}) {
  const [idx, setIdx] = useState(0)
  const [animDir, setAnimDir] = useState<'up' | 'down' | null>(null)
  const touchStartY = useRef(0)
  const animating = useRef(false)

  // Also keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        navigate(e.key === 'ArrowDown' ? 'up' : 'down')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function navigate(dir: 'up' | 'down') {
    if (animating.current) return
    if (dir === 'up' && idx >= profiles.length - 1) return
    if (dir === 'down' && idx <= 0) return
    animating.current = true
    setAnimDir(dir)
    setTimeout(() => {
      setIdx(i => dir === 'up' ? i + 1 : i - 1)
      setAnimDir(null)
      animating.current = false
    }, 240)
  }

  if (profiles.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="text-6xl">✨</div>
        <h2 className="text-xl font-bold">Acabou por hoje!</h2>
        <p className="text-dark-300 text-sm max-w-xs">Você viu todos os perfis disponíveis. Ajuste os filtros ou volte mais tarde.</p>
        <button onClick={onReload}
          className="px-6 py-2.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-sm font-medium hover:bg-gold-500/20 transition-colors">
          Recarregar
        </button>
      </div>
    )
  }

  const profile = profiles[idx]

  // Card exit transform
  const transform = animDir === 'up'
    ? 'translateY(-105%)'
    : animDir === 'down'
    ? 'translateY(105%)'
    : 'translateY(0)'

  return (
    <div
      className="relative h-full w-full bg-dark-900 overflow-hidden"
      onTouchStart={e => { touchStartY.current = e.touches[0].clientY }}
      onTouchEnd={e => {
        const delta = touchStartY.current - e.changedTouches[0].clientY
        if (delta > 60) navigate('up')
        else if (delta < -60) navigate('down')
      }}
      // Desktop scroll wheel
      onWheel={e => {
        if (e.deltaY > 40) navigate('up')
        else if (e.deltaY < -40) navigate('down')
      }}
    >
      <div
        className="h-full w-full"
        style={{
          transform,
          transition: animDir ? 'transform 0.24s cubic-bezier(0.4,0,0.2,1)' : 'none',
        }}
      >
        <TikTokCard
          key={profile.id}
          profile={profile}
          liked={likedIds.has(profile.id)}
          onLike={() => onLike(profile.id)}
          onFavorite={() => onFavorite(profile.id)}
          onNext={idx < profiles.length - 1 ? () => navigate('up') : undefined}
          onPrev={idx > 0 ? () => navigate('down') : undefined}
          current={idx + 1}
          total={profiles.length}
        />
      </div>
    </div>
  )
}

function TikTokCard({ profile, liked, onLike, onFavorite, onNext, onPrev, current, total }: {
  profile: Profile
  liked: boolean
  onLike: () => void
  onFavorite: () => void
  onNext?: () => void
  onPrev?: () => void
  current: number
  total: number
}) {
  const [photoIdx, setPhotoIdx] = useState(0)
  const age = profile.birthDate ? calculateAge(profile.birthDate) : null

  function cyclePhoto(e: React.MouseEvent) {
    e.stopPropagation()
    if (profile.photos.length > 1) {
      setPhotoIdx(i => (i + 1) % profile.photos.length)
    }
  }

  return (
    <div className="relative w-full h-full select-none">
      {/* Background photo */}
      <div className="absolute inset-0 bg-dark-900" onClick={cyclePhoto}>
        {profile.photos[photoIdx] ? (
          <img
            src={profile.photos[photoIdx]}
            alt={profile.name}
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
            onContextMenu={e => e.preventDefault()}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl font-bold text-dark-600">
            {profile.name[0]}
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30 pointer-events-none" />
      </div>

      {/* Photo dots + counter */}
      <div className="absolute top-4 left-0 right-0 px-4 flex items-center gap-2 z-10">
        {profile.photos.length > 1 ? (
          <div className="flex gap-1 flex-1">
            {profile.photos.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all cursor-pointer ${i === photoIdx ? 'bg-white flex-[2]' : 'bg-white/35 flex-1'}`}
                onClick={e => { e.stopPropagation(); setPhotoIdx(i) }}
              />
            ))}
          </div>
        ) : <div className="flex-1" />}
        <span className="text-xs text-white/60 shrink-0 bg-black/30 px-2 py-0.5 rounded-full">
          {current}/{total}
        </span>
      </div>

      {/* Verified badge */}
      {profile.verified && (
        <div className="absolute top-10 right-4 flex items-center gap-1 bg-dark-900/70 border border-gold-500/30 px-2 py-1 rounded-full z-10 verified-pulse">
          <Shield size={11} className="text-gold-400" />
          <span className="text-[10px] text-gold-400 font-medium">Verificada</span>
        </div>
      )}

      {/* Right side action buttons */}
      <div className="absolute right-4 bottom-44 flex flex-col items-center gap-5 z-10 md:bottom-36">
        <Link
          href={`/profile/${profile.id}`}
          className="flex flex-col items-center gap-1"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-12 h-12 rounded-full bg-black/50 border border-white/20 flex items-center justify-center backdrop-blur-sm">
            <Info size={20} className="text-white" />
          </div>
          <span className="text-xs text-white/70">Perfil</span>
        </Link>

        <button onClick={onFavorite} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-black/50 border border-white/20 flex items-center justify-center backdrop-blur-sm hover:bg-white/10 transition-colors">
            <Star size={20} className="text-white" />
          </div>
          <span className="text-xs text-white/70">Salvar</span>
        </button>
      </div>

      {/* Nav arrows — desktop only */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-2 z-10">
        {onPrev && (
          <button
            onClick={onPrev}
            className="w-9 h-9 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <ChevronUp size={18} />
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            className="w-9 h-9 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <ChevronDown size={18} />
          </button>
        )}
      </div>

      {/* Bottom info + match button */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-20 md:pb-6 z-10">
        {/* Profile info */}
        <div className="mb-4">
          <div className="flex items-end gap-3 mb-1">
            <h2 className="text-3xl font-bold text-white leading-none">
              {profile.name}
            </h2>
            {age && (
              <span className="text-2xl font-light text-white/80 leading-none mb-0.5">{age}</span>
            )}
          </div>
          {(profile.city || profile.state) && (
            <p className="text-sm text-white/60 flex items-center gap-1.5 mt-1">
              <MapPin size={13} />
              {[profile.city, profile.state].filter(Boolean).join(', ')}
            </p>
          )}
          {profile.bio && (
            <p className="text-sm text-white/55 mt-1.5 line-clamp-2 max-w-[280px]">{profile.bio}</p>
          )}
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {profile.interests.slice(0, 3).map(i => (
                <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-black/40 border border-white/20 text-white/70">
                  {i}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Match button */}
        <button
          onClick={onLike}
          disabled={liked}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-2xl ${liked
            ? 'bg-gold-500/25 border-2 border-gold-500/50 text-gold-400'
            : 'bg-gold-500 hover:bg-gold-400 active:scale-[0.97] text-dark-900'
          }`}
        >
          <Heart size={24} className={liked ? 'fill-gold-400' : ''} />
          {liked ? 'Match Enviado ✓' : 'Dar Match'}
        </button>
      </div>
    </div>
  )
}

// ── GRID CARD ─────────────────────────────────────────────────────────────────

function GridCard({ profile, liked, onLike, onFavorite }: {
  profile: Profile
  liked: boolean
  onLike: () => void
  onFavorite: () => void
}) {
  const age = profile.birthDate ? calculateAge(profile.birthDate) : null

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-dark-800 border border-dark-600 hover:border-gold-500/30 transition-all card-hover">
      <Link href={`/profile/${profile.id}`} className="block">
        <div className="aspect-[3/4] relative overflow-hidden bg-dark-700">
          {profile.photos[0] ? (
            <img src={profile.photos[0]} alt={profile.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-dark-500">
              {profile.name[0]}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-transparent to-transparent" />
          {profile.verified && (
            <div className="absolute top-2 right-2 bg-gold-500/90 rounded-full p-1 verified-pulse">
              <Shield size={12} className="text-dark-900" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="font-bold text-sm">{profile.name}{age ? `, ${age}` : ''}</p>
            {(profile.city || profile.state) && (
              <p className="text-xs text-dark-200 flex items-center gap-1 mt-0.5">
                <MapPin size={10} />
                {[profile.city, profile.state].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>
      </Link>
      <div className="p-2 flex gap-2">
        <button onClick={onFavorite}
          className="flex-1 py-2 rounded-xl bg-dark-700 hover:bg-dark-600 text-dark-200 hover:text-gold-400 transition-colors flex items-center justify-center">
          <Star size={16} />
        </button>
        <button onClick={onLike} disabled={liked}
          className={`flex-1 py-2 rounded-xl transition-colors flex items-center justify-center ${liked ? 'bg-gold-500/20 text-gold-400' : 'bg-dark-700 hover:bg-gold-500/20 text-dark-200 hover:text-gold-400'}`}>
          <Heart size={16} className={liked ? 'fill-gold-400' : ''} />
        </button>
      </div>
    </div>
  )
}
