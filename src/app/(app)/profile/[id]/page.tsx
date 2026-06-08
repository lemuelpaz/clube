'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Heart, Star, Shield, MapPin, MessageCircle,
  AlertCircle, X, Flame, Grid3X3, ChevronDown, ChevronUp, Flag, Ban
} from 'lucide-react'
import { calculateAge, timeAgo, formatCurrency, isOnline } from '@/lib/utils'
import WatermarkedPhoto from '@/components/WatermarkedPhoto'

const HOT_PRICES = [19.90, 29.90, 49.90, 99.90]

export default function ProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const viewerId = (session?.user as any)?.id ?? ''
  const viewerRole = (session?.user as any)?.role

  const [profile, setProfile] = useState<any>(null)
  const [liked, setLiked] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [matchId, setMatchId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Hot modal
  const [showHotModal, setShowHotModal] = useState(false)
  const [hotPrice, setHotPrice] = useState(29.90)
  const [hotMessage, setHotMessage] = useState('')
  const [hotLoading, setHotLoading] = useState(false)
  const [hotSent, setHotSent] = useState(false)

  // Lightbox
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  // Sugar profile expanded
  const [sugarExpanded, setSugarExpanded] = useState(false)

  const [startingConv, setStartingConv] = useState(false)
  const [blockConfirm, setBlockConfirm] = useState(false)
  const [blocking, setBlocking] = useState(false)

  // Report modal
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDesc, setReportDesc] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [reportSent, setReportSent] = useState(false)

  useEffect(() => {
    if (!id) return
    async function load() {
      try {
        const [profileRes, matchesRes] = await Promise.all([
          fetch(`/api/users/${id}`),
          fetch('/api/matches'),
        ])
        if (profileRes.ok) {
          const d = await profileRes.json()
          if (d.user) setProfile(d.user)
          else setError('Perfil não encontrado.')
        } else {
          setError('Perfil não encontrado.')
        }
        if (matchesRes.ok) {
          const md = await matchesRes.json()
          const m = (md.matches ?? []).find((x: any) => x.user?.id === id)
          if (m) setMatchId(m.id)
        }
      } catch {
        setError('Erro ao carregar perfil.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleLike() {
    if (liked) return
    const res = await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toUserId: id }),
    })
    const data = await res.json()
    if (data.liked) {
      setLiked(true)
      if (data.match) setMatchId(data.match.id)
    }
  }

  async function handleMessage() {
    if (matchId) { router.push(`/messages/${matchId}`); return }
    setStartingConv(true)
    try {
      const res = await fetch('/api/conversations/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: id }),
      })
      const data = await res.json()
      if (data.matchId) {
        setMatchId(data.matchId)
        router.push(`/messages/${data.matchId}`)
      }
    } finally {
      setStartingConv(false)
    }
  }

  async function handleFavorite() {
    const method = favorited ? 'DELETE' : 'POST'
    const res = await fetch('/api/favorites', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favoriteUserId: id }),
    })
    if (res.ok) setFavorited(!favorited)
  }

  async function handleBlock() {
    setBlocking(true)
    try {
      await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedId: id }),
      })
      setBlockConfirm(false)
      router.push('/discover')
    } finally {
      setBlocking(false)
    }
  }

  async function handleReport() {
    if (!reportReason) return
    setReportLoading(true)
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportedId: id, reason: reportReason, description: reportDesc }),
    })
    if (res.ok) {
      setReportSent(true)
      setTimeout(() => { setShowReportModal(false); setReportSent(false); setReportReason(''); setReportDesc('') }, 2500)
    }
    setReportLoading(false)
  }

  async function handleHotRequest() {
    setHotLoading(true)
    const res = await fetch('/api/hot-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: id, price: hotPrice, message: hotMessage }),
    })
    if (res.ok) {
      setHotSent(true)
      setTimeout(() => { setShowHotModal(false); setHotSent(false) }, 2000)
    }
    setHotLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 p-6">
        <AlertCircle className="text-red-400" size={40} />
        <p className="text-dark-300">{error || 'Perfil não encontrado.'}</p>
        <Link href="/discover" className="bg-gold-500 hover:bg-gold-400 text-dark-50 font-bold px-6 py-2.5 rounded-full text-sm transition-colors">
          Voltar
        </Link>
      </div>
    )
  }

  const age = profile.birthDate ? calculateAge(profile.birthDate) : null
  const isMaleViewing = viewerRole === 'MALE'
  const isOwnProfile = viewerId === id
  const online = isOnline(profile.lastSeen)
  const photos: string[] = profile.photos ?? []
  const postCount = photos.length

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 bg-dark-800/90 backdrop-blur-lg border-b border-dark-700/60 px-4 py-3 flex items-center gap-3">
        <Link href="/discover" className="text-dark-300 hover:text-dark-50 transition-colors p-1">
          <ArrowLeft size={20} />
        </Link>
        <span className="font-bold text-sm">{profile.name}</span>
        {profile.verified && <Shield size={14} className="text-gold-400" />}
        {online && (
          <span className="ml-auto text-xs text-green-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            Online agora
          </span>
        )}
      </div>

      {/* Profile header */}
      <div className="relative">
        {/* Cover gradient */}
        <div
          className="h-40 w-full"
          style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #3A0610 50%, #C41E3A 100%)' }}
        />

        {/* Avatar */}
        <div className="absolute left-5 -bottom-14">
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-dark-800 overflow-hidden bg-dark-700 shadow-xl">
              {photos[0] ? (
                <img
                  src={photos[0]}
                  alt={profile.name}
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gold-400">
                  {profile.name[0]}
                </div>
              )}
            </div>
            {/* Online dot */}
            {online && (
              <span className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full bg-green-400 border-2 border-dark-800 shadow" />
            )}
          </div>
        </div>

        {/* Action buttons — top right */}
        {!isOwnProfile && (
          <div className="absolute right-4 bottom-3 flex items-center gap-2">
            {/* Denunciar */}
            <button
              onClick={() => setShowReportModal(true)}
              title="Denunciar"
              className="p-2 rounded-full border bg-dark-800/80 border-dark-600 text-dark-300 hover:border-red-500/40 hover:text-red-400 transition-all"
            >
              <Flag size={16} />
            </button>

            {/* Bloquear */}
            <button
              onClick={() => setBlockConfirm(true)}
              title="Bloquear usuário"
              className="p-2 rounded-full border bg-dark-800/80 border-dark-600 text-dark-300 hover:border-red-500/40 hover:text-red-400 transition-all"
            >
              <Ban size={16} />
            </button>

            {/* Favoritar */}
            <button
              onClick={handleFavorite}
              title={favorited ? 'Remover dos favoritos' : 'Favoritar'}
              className={`p-2 rounded-full border transition-all ${favorited
                ? 'bg-gold-500/20 border-gold-500/50 text-gold-400'
                : 'bg-dark-800/80 border-dark-600 text-dark-200 hover:border-gold-500/40 hover:text-gold-400'
              }`}
            >
              <Star size={17} className={favorited ? 'fill-gold-400' : ''} />
            </button>

            {/* Mensagem — sempre disponível */}
            <button
              onClick={handleMessage}
              disabled={startingConv}
              className="flex items-center gap-1.5 bg-gold-500 hover:bg-gold-400 text-dark-50 font-bold px-4 py-2 rounded-full text-sm transition-colors disabled:opacity-60"
            >
              {startingConv
                ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <MessageCircle size={15} />
              }
              Mensagem
            </button>
          </div>
        )}
      </div>

      {/* Profile info */}
      <div className="px-5 pt-16 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{profile.name}{age ? `, ${age}` : ''}</h1>
              {profile.verified && (
                <span className="bg-gold-500/20 border border-gold-500/30 rounded-full p-1">
                  <Shield size={12} className="text-gold-400" />
                </span>
              )}
            </div>
            {(profile.city || profile.state) && (
              <p className="text-dark-300 text-sm flex items-center gap-1 mt-0.5">
                <MapPin size={12} />
                {[profile.city, profile.state].filter(Boolean).join(', ')}
              </p>
            )}
            {!online && profile.lastSeen && (
              <p className="text-xs text-dark-400 mt-0.5">Visto {timeAgo(profile.lastSeen)}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-6 mt-4 py-3 border-y border-dark-700/50">
          <div className="text-center">
            <p className="font-bold text-lg leading-none">{postCount}</p>
            <p className="text-xs text-dark-300 mt-0.5">fotos</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg leading-none">{profile.verified ? '✓' : '—'}</p>
            <p className="text-xs text-dark-300 mt-0.5">verificada</p>
          </div>
          <div className="text-center">
            <div className={`flex items-center gap-1 font-bold text-sm leading-none ${online ? 'text-green-400' : 'text-dark-300'}`}>
              <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-400' : 'bg-dark-400'}`} />
              {online ? 'Online' : 'Offline'}
            </div>
            <p className="text-xs text-dark-300 mt-0.5">status</p>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-dark-100 leading-relaxed mt-3">{profile.bio}</p>
        )}

        {/* Interests */}
        {profile.interests?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {profile.interests.map((interest: string) => (
              <span key={interest} className="px-2.5 py-1 rounded-full text-xs bg-dark-700/60 border border-dark-600/60 text-dark-100">
                {interest}
              </span>
            ))}
          </div>
        )}

        {/* CTA principal — Mensagem sempre disponível */}
        {!isOwnProfile && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleMessage}
              disabled={startingConv}
              className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-400 text-dark-50 transition-colors text-sm disabled:opacity-60"
            >
              {startingConv
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><MessageCircle size={16} />Enviar Mensagem</>
              }
            </button>
            {!liked && (
              <button
                onClick={handleLike}
                className="px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-dark-700 border border-dark-600 hover:border-gold-500/40 text-dark-200 hover:text-gold-400 transition-all text-sm"
              >
                <Heart size={16} />
                Match
              </button>
            )}
          </div>
        )}

        {/* Hot photo request */}
        {!isOwnProfile && isMaleViewing && profile.role === 'FEMALE' && (
          <button
            onClick={() => setShowHotModal(true)}
            className="mt-3 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-dark-700/60 border border-pink-500/30 text-pink-400 hover:bg-pink-500/10 hover:border-pink-500/50 transition-all text-sm"
          >
            <Flame size={16} />
            Solicitar Foto Exclusiva
          </button>
        )}
      </div>

      {/* Sugar profile — collapsible, visible to males */}
      {profile.sugarProfile && isMaleViewing && (
        <div className="mx-5 mb-4 rounded-2xl border border-gold-500/15 bg-dark-800/60 overflow-hidden">
          <button
            onClick={() => setSugarExpanded(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gold-400"
          >
            <span className="flex items-center gap-2">
              <Star size={14} className="fill-gold-400" />
              Perfil
            </span>
            {sugarExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {sugarExpanded && (
            <div className="px-4 pb-4 space-y-3 border-t border-dark-700/50 pt-3">
              {profile.sugarProfile.lookingFor?.length > 0 && (
                <div>
                  <p className="text-xs text-dark-400 mb-1.5">Procurando</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.sugarProfile.lookingFor.map((v: string) => (
                      <span key={v} className="px-2.5 py-1 rounded-full text-xs bg-dark-700 border border-dark-600 text-dark-100">{v}</span>
                    ))}
                  </div>
                </div>
              )}
              {profile.sugarProfile.allowanceRange && (
                <div className="flex justify-between items-center">
                  <p className="text-xs text-dark-400">Expectativa mensal</p>
                  <p className="text-sm font-semibold text-dark-100">{profile.sugarProfile.allowanceRange}</p>
                </div>
              )}
              {profile.sugarProfile.meetingFrequency && (
                <div className="flex justify-between items-center">
                  <p className="text-xs text-dark-400">Frequência de encontros</p>
                  <p className="text-sm font-semibold text-dark-100">{profile.sugarProfile.meetingFrequency}</p>
                </div>
              )}
              {profile.sugarProfile.availability && (
                <div className="flex justify-between items-center">
                  <p className="text-xs text-dark-400">Disponibilidade</p>
                  <p className="text-sm font-semibold text-dark-100">{profile.sugarProfile.availability}</p>
                </div>
              )}
              {profile.sugarProfile.description && (
                <p className="text-sm text-dark-100 leading-relaxed">{profile.sugarProfile.description}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Posts grid */}
      {photos.length > 0 && (
        <div>
          <div className="flex items-center gap-2 px-5 mb-2">
            <Grid3X3 size={15} className="text-dark-300" />
            <span className="text-xs text-dark-300 font-medium uppercase tracking-wider">Fotos</span>
          </div>
          <div className="grid grid-cols-3 gap-0.5">
            {photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setLightboxIdx(i)}
                className="aspect-square overflow-hidden bg-dark-700 focus:outline-none group relative"
              >
                <img
                  src={photo}
                  alt={`foto ${i + 1}`}
                  className="w-full h-full object-cover pointer-events-none group-hover:scale-105 transition-transform duration-300"
                  draggable={false}
                />
                {i === 0 && profile.verified && (
                  <span className="absolute top-1.5 left-1.5 bg-gold-500/90 rounded-full p-1">
                    <Shield size={9} className="text-dark-50" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-5 right-5 text-white/60 hover:text-white p-2"
            onClick={() => setLightboxIdx(null)}
          >
            <X size={24} />
          </button>
          <div className="w-full max-w-lg px-4" onClick={e => e.stopPropagation()}>
            <WatermarkedPhoto
              src={photos[lightboxIdx]}
              alt={`foto ${lightboxIdx + 1}`}
              viewerId={viewerId}
              className="w-full rounded-xl max-h-[80vh] object-contain"
            />
            {photos.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === lightboxIdx ? 'bg-gold-500 w-4' : 'bg-dark-400'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass rounded-2xl border border-red-500/20 w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-dark-600/60">
              <div className="flex items-center gap-2">
                <Flag size={16} className="text-red-400" />
                <h3 className="font-bold">Denunciar perfil</h3>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-dark-300 hover:text-dark-50">
                <X size={20} />
              </button>
            </div>

            {reportSent ? (
              <div className="text-center py-8 px-5">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-semibold text-green-400">Denúncia enviada!</p>
                <p className="text-sm text-dark-300 mt-1">Nossa equipe analisará em breve.</p>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <p className="text-sm text-dark-300">Selecione o motivo da denúncia:</p>
                <div className="space-y-2">
                  {['Perfil falso', 'Conteúdo inapropriado', 'Assédio ou spam', 'Fotos ofensivas', 'Menor de idade', 'Outro'].map(r => (
                    <button
                      key={r}
                      onClick={() => setReportReason(r)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-all ${reportReason === r
                        ? 'bg-red-500/15 border-red-500/40 text-red-400'
                        : 'bg-dark-700 border-dark-600 text-dark-100 hover:border-red-500/30'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1.5 block">Detalhes adicionais (opcional)</label>
                  <textarea
                    value={reportDesc}
                    onChange={e => setReportDesc(e.target.value)}
                    placeholder="Descreva o problema..."
                    rows={2}
                    className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-2.5 text-sm text-dark-50 placeholder-dark-400 focus:outline-none focus:border-red-500/40 transition-colors resize-none"
                  />
                </div>
                <button
                  onClick={handleReport}
                  disabled={!reportReason || reportLoading}
                  className="w-full py-3 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                >
                  {reportLoading
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Flag size={15} />Enviar denúncia</>
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hot Photo Request Modal */}
      {showHotModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass rounded-2xl p-6 border border-pink-500/20 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-pink-400" />
                <h3 className="font-bold">Solicitar Foto Exclusiva</h3>
              </div>
              <button onClick={() => setShowHotModal(false)} className="text-dark-300 hover:text-dark-50">
                <X size={20} />
              </button>
            </div>

            {hotSent ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">🔥</div>
                <p className="font-semibold text-green-400">Solicitação enviada!</p>
                <p className="text-sm text-dark-300 mt-1">Aguarde a resposta de {profile.name}.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-dark-200 mb-4">
                  Escolha o valor da oferta. {profile.name} receberá sua solicitação e poderá enviar uma foto exclusiva.
                </p>

                <div className="mb-4">
                  <p className="text-xs text-dark-400 mb-2">Valor da oferta</p>
                  <div className="grid grid-cols-2 gap-2">
                    {HOT_PRICES.map(p => (
                      <button key={p} onClick={() => setHotPrice(p)}
                        className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${hotPrice === p
                          ? 'bg-pink-500/20 border-pink-500/50 text-pink-400'
                          : 'border-dark-600 bg-dark-700 text-dark-200 hover:border-pink-500/30'
                        }`}>
                        {formatCurrency(p)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs text-dark-400 mb-1.5 block">Mensagem (opcional)</label>
                  <textarea
                    value={hotMessage}
                    onChange={e => setHotMessage(e.target.value)}
                    placeholder="Escreva uma mensagem para acompanhar..."
                    rows={2}
                    className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-2.5 text-sm text-dark-50 placeholder-dark-400 focus:outline-none focus:border-pink-500/40 transition-colors resize-none"
                  />
                </div>

                <p className="text-xs text-dark-400 mb-4">
                  Você pagará {formatCurrency(hotPrice)} ao desbloquear. {profile.name} recebe 60%.
                </p>

                <button
                  onClick={handleHotRequest}
                  disabled={hotLoading}
                  className="w-full py-3 rounded-xl font-bold bg-pink-500 hover:bg-pink-400 text-dark-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {hotLoading
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : '🔥 Enviar Solicitação'
                  }
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Block confirmation modal */}
      {blockConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
          <div className="glass rounded-2xl border border-red-500/20 w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                <Ban size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-bold">Bloquear {profile.name}?</h3>
                <p className="text-xs text-dark-300 mt-0.5">Este usuário não verá mais seu perfil.</p>
              </div>
            </div>
            <p className="text-sm text-dark-300 mb-5">
              Após bloquear, esta pessoa não aparecerá mais para você e não poderá te enviar mensagens.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setBlockConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-dark-600 text-dark-200 hover:border-dark-500 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleBlock}
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
