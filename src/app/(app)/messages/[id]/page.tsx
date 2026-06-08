'use client'

import { useState, useEffect, useRef, use, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, Send, Shield, MapPin, AlertCircle, Clock, Flame, X, Lock, Crown, ImageIcon, CheckCircle } from 'lucide-react'
import { calculateAge, timeAgo, formatCurrency, isOnline } from '@/lib/utils'

interface Msg {
  id: string
  matchId: string
  senderId: string
  content: string
  read: boolean
  createdAt: string
  expiresAt?: string
}

interface MatchUser {
  id: string
  name: string
  photos: string[]
  birthDate?: string
  city?: string
  state?: string
  verified: boolean
  lastSeen?: string
  role?: string
}

function expiryLabel(expiresAt?: string): string {
  if (!expiresAt) return ''
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'expirado'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 0) return `${h}h${m}m`
  return `${m}m`
}

function parseContent(content: string): { type?: string; [k: string]: any } | null {
  if (!content.startsWith('{')) return null
  try { return JSON.parse(content) } catch { return null }
}

const HOT_PRICES = [19.90, 29.90, 49.90, 99.90]

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = use(params)
  const { data: session } = useSession()
  const userId = (session?.user as any)?.id
  const myRole = (session?.user as any)?.role

  const [otherUser, setOtherUser] = useState<MatchUser | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isAtBottomRef = useRef(true)

  // Access gates
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null)
  const [isVerified, setIsVerified] = useState<boolean | null>(null)

  // Hot photo modal
  const [showHotModal, setShowHotModal] = useState(false)
  const [hotPrice, setHotPrice] = useState(29.90)
  const [hotMessage, setHotMessage] = useState('')
  const [hotLoading, setHotLoading] = useState(false)
  const [hotSent, setHotSent] = useState(false)

  // Hot request state
  const [hotRequests, setHotRequests] = useState<Record<string, any>>({})
  const [photoInputs, setPhotoInputs] = useState<Record<string, string>>({})
  const [unlocking, setUnlocking] = useState<Record<string, boolean>>({})
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  const canRequestHot = myRole === 'MALE' && otherUser?.role === 'FEMALE'

  function scrollToBottom(smooth = true) {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  }

  function handleScroll() {
    const el = scrollContainerRef.current
    if (!el) return
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?matchId=${matchId}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.messages) {
        setMessages(prev => {
          if ((data.messages as Msg[]).length !== prev.length && isAtBottomRef.current) {
            setTimeout(() => scrollToBottom(true), 50)
          }
          return data.messages
        })
      }
    } catch {}
  }, [matchId])

  async function loadHotRequest(requestId: string) {
    if (hotRequests[requestId] !== undefined) return
    // Mark as loading to prevent duplicate fetches
    setHotRequests(prev => ({ ...prev, [requestId]: null }))
    try {
      const res = await fetch(`/api/hot-requests?requestId=${requestId}`)
      if (res.ok) {
        const d = await res.json()
        if (d.request) setHotRequests(prev => ({ ...prev, [requestId]: d.request }))
      }
    } catch {}
  }

  // Load hot request data for special messages
  useEffect(() => {
    messages.forEach(msg => {
      const parsed = parseContent(msg.content)
      if (parsed && (parsed.type === 'hot_request' || parsed.type === 'hot_photo') && parsed.requestId) {
        loadHotRequest(parsed.requestId)
      }
    })
  }, [messages])

  useEffect(() => {
    if (!matchId) return

    async function init() {
      try {
        const [matchRes, msgRes] = await Promise.all([
          fetch('/api/matches'),
          fetch(`/api/messages?matchId=${matchId}`),
        ])

        if (matchRes.ok) {
          const matchData = await matchRes.json()
          const m = (matchData.matches ?? []).find((x: any) => x.id === matchId)
          if (m) setOtherUser(m.user)
          else setError('Conversa não encontrada.')
        }

        if (msgRes.ok) {
          const msgData = await msgRes.json()
          if (msgData.messages) {
            setMessages(msgData.messages)
            setTimeout(() => scrollToBottom(false), 100)
          }
        }
      } catch {
        setError('Erro ao carregar conversa.')
      } finally {
        setLoading(false)
      }
    }

    if (myRole === 'MALE') {
      fetch('/api/subscriptions').then(r => r.json()).then(d => {
        setHasSubscription(!!(d.active && d.active.status === 'ACTIVE'))
      }).catch(() => setHasSubscription(false))
    }
    if (myRole === 'FEMALE' && userId) {
      fetch(`/api/users/${userId}`).then(r => r.json()).then(d => {
        setIsVerified(!!(d.user?.verified))
      }).catch(() => setIsVerified(false))
    }

    init()
    pollingRef.current = setInterval(fetchMessages, 3000)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [matchId, fetchMessages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending) return
    setSending(true)
    setSendError('')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, content: input.trim() }),
      })
      const data = await res.json()
      if (res.status === 403) {
        setSendError(data.error ?? 'Sem permissão para enviar mensagens')
      } else if (data.message) {
        setMessages(prev => [...prev, data.message])
        setInput('')
        setTimeout(() => scrollToBottom(true), 50)
      }
    } catch {
      setSendError('Erro de conexão. Tente novamente.')
    }
    setSending(false)
  }

  async function sendHotRequest() {
    setHotLoading(true)
    try {
      const res = await fetch('/api/hot-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: otherUser?.id, price: hotPrice, message: hotMessage }),
      })
      if (res.ok) {
        setHotSent(true)
        setTimeout(() => { setShowHotModal(false); setHotSent(false); setHotMessage('') }, 2500)
        await fetchMessages()
      }
    } catch {}
    setHotLoading(false)
  }

  async function handleHotAction(requestId: string, action: string, photoUrl?: string) {
    setActionLoading(prev => ({ ...prev, [requestId]: true }))
    try {
      const body: any = { requestId, action }
      if (photoUrl) body.photoUrl = photoUrl
      const res = await fetch('/api/hot-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const d = await res.json()
        if (d.request) setHotRequests(prev => ({ ...prev, [requestId]: d.request }))
        if (action === 'send_photo') {
          setPhotoInputs(prev => ({ ...prev, [requestId]: '' }))
          await fetchMessages()
        }
      }
    } catch {}
    setActionLoading(prev => ({ ...prev, [requestId]: false }))
  }

  async function handleUnlock(requestId: string) {
    setUnlocking(prev => ({ ...prev, [requestId]: true }))
    try {
      const res = await fetch('/api/hot-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'pay' }),
      })
      if (res.ok) {
        const d = await res.json()
        if (d.request) setHotRequests(prev => ({ ...prev, [requestId]: d.request }))
      }
    } catch {}
    setUnlocking(prev => ({ ...prev, [requestId]: false }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 p-6">
        <AlertCircle className="text-red-400" size={40} />
        <p className="text-dark-300 text-center">{error}</p>
        <Link href="/matches" className="bg-gold-500 hover:bg-gold-400 text-dark-50 font-bold px-6 py-2.5 rounded-full text-sm transition-colors">
          Voltar para Matches
        </Link>
      </div>
    )
  }

  const maleBlurReceived = myRole === 'MALE' && hasSubscription === false
  const femaleNeedsVerif = myRole === 'FEMALE' && isVerified === false
  const canSend = !(myRole === 'MALE' && hasSubscription === false)

  function renderMessage(msg: Msg) {
    const isMine = msg.senderId === userId
    const expiry = expiryLabel(msg.expiresAt)
    const isBlurred = !isMine && maleBlurReceived
    const isHidden = !isMine && femaleNeedsVerif

    if (isBlurred || isHidden) {
      return (
        <div key={msg.id} className="flex justify-start">
          <div className="relative max-w-xs">
            <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-dark-700 border border-dark-600 select-none">
              <p className="text-sm blur-sm select-none pointer-events-none">{'● '.repeat(12)}</p>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-dark-400">
                <span className="blur-sm">agora</span>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
              <div className="flex items-center gap-1.5 bg-dark-900/80 rounded-full px-3 py-1 text-xs font-medium text-dark-200">
                <Lock size={11} />
                {maleBlurReceived ? 'Assine para ler' : 'Verifique para ler'}
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Try to parse as special message type
    const parsed = parseContent(msg.content)

    if (parsed?.type === 'hot_request') {
      const req = hotRequests[parsed.requestId]
      const loading = actionLoading[parsed.requestId]
      return (
        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
          <div className="max-w-xs w-full rounded-2xl border border-pink-500/30 bg-dark-800/80 overflow-hidden">
            <div className="px-4 py-3 bg-pink-500/10 border-b border-pink-500/20 flex items-center gap-2">
              <Flame size={14} className="text-pink-400" />
              <span className="text-sm font-bold text-pink-300">Foto Exclusiva</span>
              <span className="ml-auto text-sm font-bold text-pink-400">{formatCurrency(parsed.price)}</span>
            </div>
            {parsed.note && (
              <p className="px-4 pt-3 text-xs text-dark-300 italic">"{parsed.note}"</p>
            )}
            <div className="px-4 py-3">
              {myRole === 'FEMALE' && req && (
                <>
                  {req.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleHotAction(parsed.requestId, 'reject')}
                        disabled={loading}
                        className="flex-1 py-2 rounded-xl border border-dark-600 text-dark-300 hover:text-red-400 hover:border-red-500/40 text-xs font-medium transition-colors disabled:opacity-40"
                      >
                        Recusar
                      </button>
                      <button
                        onClick={() => handleHotAction(parsed.requestId, 'accept')}
                        disabled={loading}
                        className="flex-1 py-2 rounded-xl bg-pink-500 hover:bg-pink-400 text-white text-xs font-bold transition-colors disabled:opacity-40"
                      >
                        {loading ? '...' : 'Aceitar'}
                      </button>
                    </div>
                  )}
                  {req.status === 'ACCEPTED' && (
                    <div className="space-y-2">
                      <input
                        value={photoInputs[parsed.requestId] ?? ''}
                        onChange={e => setPhotoInputs(prev => ({ ...prev, [parsed.requestId]: e.target.value }))}
                        placeholder="URL da foto exclusiva..."
                        className="w-full bg-dark-700 border border-dark-500 rounded-xl px-3 py-2 text-xs text-dark-50 placeholder-dark-400 focus:outline-none focus:border-pink-500/50"
                      />
                      <button
                        onClick={() => handleHotAction(parsed.requestId, 'send_photo', photoInputs[parsed.requestId])}
                        disabled={loading || !photoInputs[parsed.requestId]?.trim()}
                        className="w-full py-2 rounded-xl bg-pink-500 hover:bg-pink-400 text-white text-xs font-bold transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                      >
                        <ImageIcon size={12} />
                        {loading ? 'Enviando...' : 'Enviar Foto'}
                      </button>
                    </div>
                  )}
                  {(req.status === 'PHOTO_SENT' || req.status === 'PAID') && (
                    <div className="flex items-center gap-2 text-xs text-green-400">
                      <CheckCircle size={13} />
                      {req.status === 'PAID' ? 'Foto desbloqueada pelo cliente ✓' : 'Foto enviada — aguardando pagamento'}
                    </div>
                  )}
                  {req.status === 'REJECTED' && (
                    <p className="text-xs text-dark-400">Solicitação recusada</p>
                  )}
                </>
              )}
              {myRole === 'MALE' && req && (
                <>
                  {req.status === 'PENDING' && <p className="text-xs text-dark-400">Aguardando resposta...</p>}
                  {req.status === 'ACCEPTED' && <p className="text-xs text-pink-400">Aceita! Aguardando a foto...</p>}
                  {req.status === 'PHOTO_SENT' && (
                    <button
                      onClick={() => handleUnlock(parsed.requestId)}
                      disabled={unlocking[parsed.requestId]}
                      className="w-full py-2 rounded-xl bg-pink-500 hover:bg-pink-400 text-white text-xs font-bold transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                      <Lock size={12} />
                      {unlocking[parsed.requestId] ? 'Processando...' : `Desbloquear por ${formatCurrency(parsed.price)}`}
                    </button>
                  )}
                  {req.status === 'PAID' && <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={12} />Desbloqueada — veja a foto abaixo</p>}
                  {req.status === 'REJECTED' && <p className="text-xs text-dark-400">Solicitação recusada</p>}
                </>
              )}
              {!req && <p className="text-xs text-dark-500 animate-pulse">Carregando...</p>}
            </div>
            <div className="px-4 pb-2 text-[10px] text-dark-500 text-right">{timeAgo(msg.createdAt)}</div>
          </div>
        </div>
      )
    }

    if (parsed?.type === 'hot_photo') {
      const req = hotRequests[parsed.requestId]
      return (
        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
          <div className="max-w-xs w-full rounded-2xl border border-pink-500/30 bg-dark-800/80 overflow-hidden">
            <div className="px-4 py-2.5 bg-pink-500/10 border-b border-pink-500/20 flex items-center gap-2">
              <ImageIcon size={13} className="text-pink-400" />
              <span className="text-xs font-bold text-pink-300">Foto Exclusiva</span>
              <span className="ml-auto text-xs font-bold text-pink-400">{formatCurrency(parsed.price)}</span>
            </div>
            <div className="p-3">
              {myRole === 'FEMALE' ? (
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <CheckCircle size={13} />
                  {req?.status === 'PAID' ? 'Desbloqueada pelo cliente ✓' : 'Enviada — aguardando pagamento'}
                </div>
              ) : req?.status === 'PAID' ? (
                <img
                  src={parsed.photoUrl || req?.photoUrl}
                  alt="Foto exclusiva"
                  className="w-full rounded-xl object-cover max-h-64 pointer-events-none"
                  draggable={false}
                  onContextMenu={e => e.preventDefault()}
                />
              ) : (
                <div className="relative">
                  <div className="w-full h-40 rounded-xl bg-dark-700 flex items-center justify-center">
                    <Lock size={28} className="text-dark-500" />
                  </div>
                  <div className="mt-2">
                    <button
                      onClick={() => handleUnlock(parsed.requestId)}
                      disabled={unlocking[parsed.requestId]}
                      className="w-full py-2 rounded-xl bg-pink-500 hover:bg-pink-400 text-white text-xs font-bold transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                      <Lock size={12} />
                      {unlocking[parsed.requestId] ? 'Processando...' : `Desbloquear por ${formatCurrency(parsed.price)}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="px-4 pb-2 text-[10px] text-dark-500 text-right">{timeAgo(msg.createdAt)}</div>
          </div>
        </div>
      )
    }

    // Normal text message
    return (
      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${isMine
          ? 'bg-gold-500/20 border border-gold-500/20 text-dark-50 rounded-br-sm'
          : 'bg-dark-700 border border-dark-600 text-dark-50 rounded-bl-sm'
        }`}>
          <p>{msg.content}</p>
          <div className={`flex items-center gap-1 mt-1 text-[10px] ${isMine ? 'text-gold-400/60 justify-end' : 'text-dark-400'}`}>
            <span>{timeAgo(msg.createdAt)}</span>
            {expiry && <span className="opacity-60">· {expiry}</span>}
            {isMine && <span>{msg.read ? '✓✓' : '✓'}</span>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-screen pb-16 md:pb-0">
      {/* Header */}
      <div className="bg-dark-800 border-b border-dark-600 px-4 py-3 flex items-center gap-3 shrink-0">
        <Link href="/matches" className="text-dark-300 hover:text-dark-50 transition-colors p-1">
          <ArrowLeft size={20} />
        </Link>
        {otherUser && (
          <>
            <Link href={`/profile/${otherUser.id}`} className="relative shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-dark-700">
                {otherUser.photos[0] ? (
                  <img src={otherUser.photos[0]} alt={otherUser.name} className="w-full h-full object-cover pointer-events-none" draggable={false} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-gold-400">
                    {otherUser.name[0]}
                  </div>
                )}
              </div>
              {otherUser.verified && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-gold-500 rounded-full p-0.5">
                  <Shield size={9} className="text-dark-50" />
                </div>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">
                {otherUser.name}
                {otherUser.birthDate ? `, ${calculateAge(otherUser.birthDate)}` : ''}
              </p>
              {isOnline(otherUser.lastSeen) ? (
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  Online agora
                </p>
              ) : (otherUser.city || otherUser.state) ? (
                <p className="text-xs text-dark-300 flex items-center gap-1">
                  <MapPin size={9} />
                  {[otherUser.city, otherUser.state].filter(Boolean).join(', ')}
                </p>
              ) : null}
            </div>

            {canRequestHot && (
              <button
                onClick={() => setShowHotModal(true)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-700 border border-pink-500/30 text-pink-400 text-xs font-medium hover:bg-pink-500/10 hover:border-pink-500/50 transition-all"
              >
                <Flame size={13} />
                Foto Exclusiva
              </button>
            )}
          </>
        )}
      </div>

      {/* 24h expiry notice */}
      <div className="bg-dark-700/40 border-b border-dark-600/50 px-4 py-1.5 flex items-center gap-2 shrink-0">
        <Clock size={11} className="text-gold-400/70 shrink-0" />
        <span className="text-[11px] text-dark-400">Mensagens expiram em 24h</span>
      </div>

      {/* Female verification gate banner */}
      {femaleNeedsVerif && (
        <div className="mx-4 mt-3 mb-1 bg-yellow-500/10 border border-yellow-500/25 rounded-xl px-4 py-3 flex items-center gap-3 shrink-0">
          <Lock size={16} className="text-yellow-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-yellow-300">Verificação necessária para ler mensagens</p>
            <p className="text-xs text-dark-400 mt-0.5">Você pode enviar mensagens, mas só poderá ler as respostas após verificar seu perfil.</p>
          </div>
          <Link href="/verification" className="shrink-0 text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-3 py-1.5 rounded-lg font-medium transition-colors">
            Verificar
          </Link>
        </div>
      )}

      {/* Male subscription gate banner */}
      {maleBlurReceived && (
        <div className="mx-4 mt-3 mb-1 bg-gold-500/10 border border-gold-500/20 rounded-xl px-4 py-3 flex items-center gap-3 shrink-0">
          <Crown size={16} className="text-gold-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gold-300">Assine para ler e enviar mensagens</p>
            <p className="text-xs text-dark-400 mt-0.5">Com a assinatura você lê e envia mensagens ilimitadas.</p>
          </div>
          <Link href="/subscription" className="shrink-0 text-xs bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 px-3 py-1.5 rounded-lg font-medium transition-colors">
            Assinar
          </Link>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.length === 0 && (
          <div className="text-center py-10 text-dark-400 text-sm">
            Vocês fizeram match! Diga olá 👋
          </div>
        )}
        {messages.map(msg => renderMessage(msg))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="bg-dark-800 border-t border-dark-600 p-4 shrink-0">
        {sendError && (
          <p className="text-xs text-red-400 mb-2 flex items-center gap-1.5">
            <AlertCircle size={12} />
            {sendError}
          </p>
        )}
        {canSend ? (
          <form onSubmit={sendMessage} className="flex items-center gap-3">
            <input
              value={input}
              onChange={e => { setInput(e.target.value); if (sendError) setSendError('') }}
              placeholder="Digite uma mensagem..."
              className="flex-1 bg-dark-700 border border-dark-500 rounded-xl px-4 py-2.5 text-sm text-dark-50 placeholder-dark-400 focus:outline-none focus:border-gold-500/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="w-10 h-10 rounded-xl bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-dark-50 flex items-center justify-center transition-colors shrink-0"
            >
              {sending
                ? <div className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                : <Send size={16} />
              }
            </button>
          </form>
        ) : (
          <Link
            href="/subscription"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gold-500/15 border border-gold-500/20 text-gold-400 text-sm font-medium hover:bg-gold-500/25 transition-colors"
          >
            <Crown size={16} />
            Assine para enviar mensagens
          </Link>
        )}
      </div>

      {/* Foto Exclusiva Modal */}
      {showHotModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
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
                <p className="text-sm text-dark-300 mt-1">Aguarde a resposta de {otherUser?.name}.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-dark-200 mb-4">
                  Escolha o valor. {otherUser?.name} receberá sua proposta e poderá enviar uma foto exclusiva desbloqueável.
                </p>

                <div className="mb-4">
                  <p className="text-xs text-dark-400 mb-2">Valor da oferta</p>
                  <div className="grid grid-cols-2 gap-2">
                    {HOT_PRICES.map(p => (
                      <button key={p} onClick={() => setHotPrice(p)}
                        className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${hotPrice === p
                          ? 'bg-pink-500/20 border-pink-500/50 text-pink-400'
                          : 'border-dark-500 bg-dark-800 text-dark-200 hover:border-pink-500/30'
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
                    placeholder="Escreva uma mensagem..."
                    rows={2}
                    className="w-full bg-dark-800 border border-dark-500 rounded-xl px-4 py-2.5 text-sm text-dark-50 placeholder-dark-400 focus:outline-none focus:border-pink-500/40 transition-colors resize-none"
                  />
                </div>

                <p className="text-xs text-dark-400 mb-4">
                  Você paga {formatCurrency(hotPrice)} ao desbloquear a foto exclusiva.
                </p>

                <button
                  onClick={sendHotRequest}
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
    </div>
  )
}
