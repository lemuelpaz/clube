'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, Flame, Lock, Unlock, Check, X, Upload, Eye, EyeOff } from 'lucide-react'
import { formatCurrency, timeAgo } from '@/lib/utils'

interface HotRequest {
  id: string
  requesterId: string
  targetId: string
  price: number
  message?: string
  status: 'PENDING' | 'ACCEPTED' | 'PHOTO_SENT' | 'PAID' | 'REJECTED'
  photoUrl?: string
  createdAt: string
  // populated
  requesterName?: string
  requesterPhoto?: string
  targetName?: string
  targetPhoto?: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Aguardando', color: 'text-yellow-400' },
  ACCEPTED: { label: 'Aceito', color: 'text-blue-400' },
  PHOTO_SENT: { label: 'Foto Enviada', color: 'text-purple-400' },
  PAID: { label: 'Pago ✓', color: 'text-green-400' },
  REJECTED: { label: 'Recusado', color: 'text-red-400' },
}

export default function HotRequestsPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role

  const [requests, setRequests] = useState<HotRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [photoInputs, setPhotoInputs] = useState<Record<string, string>>({})
  const [showPhoto, setShowPhoto] = useState<Record<string, boolean>>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/hot-requests')
      .then(r => r.json())
      .then(d => { setRequests(d.requests ?? []) })
      .finally(() => setLoading(false))
  }, [])

  async function doAction(requestId: string, action: string, extra?: object) {
    setActionLoading(requestId)
    const res = await fetch('/api/hot-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action, ...extra }),
    })
    const data = await res.json()
    if (data.request) {
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, ...data.request } : r))
    }
    setActionLoading(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-lg border-b border-dark-700 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/discover" className="text-dark-300 hover:text-dark-50 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <Flame size={18} className="text-orange-400" />
          <h1 className="font-bold">Fotos Exclusivas</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-20 text-dark-400">
            <Flame size={40} className="mx-auto mb-4 opacity-30" />
            <p className="text-sm">
              {role === 'FEMALE'
                ? 'Nenhuma solicitação recebida ainda.'
                : 'Você não fez nenhuma solicitação ainda.'}
            </p>
            {role === 'MALE' && (
              <p className="text-xs text-dark-500 mt-1">Visite um perfil feminino para solicitar fotos exclusivas.</p>
            )}
          </div>
        ) : (
          requests.map(req => (
            <RequestCard
              key={req.id}
              req={req}
              role={role}
              photoInput={photoInputs[req.id] ?? ''}
              setPhotoInput={v => setPhotoInputs(p => ({ ...p, [req.id]: v }))}
              showUnlocked={showPhoto[req.id] ?? false}
              toggleShow={() => setShowPhoto(p => ({ ...p, [req.id]: !p[req.id] }))}
              onAction={(action, extra) => doAction(req.id, action, extra)}
              actionLoading={actionLoading === req.id}
            />
          ))
        )}
      </div>
    </div>
  )
}

function RequestCard({ req, role, photoInput, setPhotoInput, showUnlocked, toggleShow, onAction, actionLoading }: {
  req: HotRequest
  role: string
  photoInput: string
  setPhotoInput: (v: string) => void
  showUnlocked: boolean
  toggleShow: () => void
  onAction: (action: string, extra?: object) => void
  actionLoading: boolean
}) {
  const status = STATUS_LABELS[req.status] ?? STATUS_LABELS.PENDING
  const isMale = role === 'MALE'
  const otherName = isMale ? req.targetName : req.requesterName

  return (
    <div className="glass rounded-2xl p-5 border border-dark-600 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-dark-700 overflow-hidden shrink-0">
            {(isMale ? req.targetPhoto : req.requesterPhoto) ? (
              <img src={isMale ? req.targetPhoto : req.requesterPhoto} alt={otherName} className="w-full h-full object-cover pointer-events-none" draggable={false} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-dark-400">
                {otherName?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">{otherName ?? 'Usuário'}</p>
            <p className="text-xs text-dark-400">{timeAgo(req.createdAt)}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs font-semibold ${status.color}`}>{status.label}</span>
          <span className="text-sm font-bold text-gold-400">{formatCurrency(req.price)}</span>
        </div>
      </div>

      {req.message && (
        <p className="text-sm text-dark-200 bg-dark-800 rounded-xl px-4 py-2.5 border border-dark-600 italic">
          "{req.message}"
        </p>
      )}

      {/* Female: accept/reject/send photo */}
      {!isMale && (
        <>
          {req.status === 'PENDING' && (
            <div className="flex gap-2">
              <button
                onClick={() => onAction('reject')}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5"
              >
                <X size={14} /> Recusar
              </button>
              <button
                onClick={() => onAction('accept')}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-colors flex items-center justify-center gap-1.5"
              >
                <Check size={14} /> Aceitar
              </button>
            </div>
          )}

          {req.status === 'ACCEPTED' && (
            <div className="space-y-2">
              <p className="text-xs text-dark-300">Envie a URL da foto. O homem pagará {formatCurrency(req.price)} para ver. Você receberá {formatCurrency(req.price * 0.6)}.</p>
              <input
                value={photoInput}
                onChange={e => setPhotoInput(e.target.value)}
                placeholder="URL da foto (ex: https://i.imgur.com/...)"
                className="w-full bg-dark-800 border border-dark-500 rounded-xl px-4 py-2.5 text-sm text-dark-50 placeholder-dark-400 focus:outline-none focus:border-pink-500/40 transition-colors"
              />
              <button
                onClick={() => onAction('send_photo', { photoUrl: photoInput })}
                disabled={actionLoading || !photoInput.trim()}
                className="w-full py-2.5 rounded-xl bg-pink-500/20 border border-pink-500/30 text-pink-400 text-sm font-medium hover:bg-pink-500/30 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Upload size={14} /> Enviar Foto
              </button>
            </div>
          )}

          {(req.status === 'PHOTO_SENT' || req.status === 'PAID') && (
            <div className="flex items-center gap-2 text-sm text-dark-300 bg-dark-800 rounded-xl px-4 py-2.5 border border-dark-600">
              <Check size={14} className="text-green-400" />
              {req.status === 'PAID' ? 'Foto paga e desbloqueada!' : 'Aguardando pagamento do homem.'}
            </div>
          )}
        </>
      )}

      {/* Male: view status / pay to unlock */}
      {isMale && (
        <>
          {req.status === 'PHOTO_SENT' && req.photoUrl && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden aspect-video bg-dark-800">
                <img
                  src={req.photoUrl}
                  alt="Hot photo"
                  className={`w-full h-full object-cover pointer-events-none transition-all duration-300 ${showUnlocked ? '' : 'blur-2xl scale-110'}`}
                  draggable={false}
                  onContextMenu={e => e.preventDefault()}
                />
                {!showUnlocked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <Lock size={32} className="text-gold-400" />
                    <p className="text-sm font-bold text-dark-50">Pague para desbloquear</p>
                    <p className="text-xs text-dark-300">{formatCurrency(req.price)}</p>
                  </div>
                )}
              </div>
              {!showUnlocked ? (
                <button
                  onClick={() => onAction('pay')}
                  disabled={actionLoading}
                  className="w-full py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-dark-50 font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Unlock size={16} /> Pagar {formatCurrency(req.price)} e Desbloquear
                </button>
              ) : null}
            </div>
          )}

          {req.status === 'PAID' && req.photoUrl && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden aspect-video bg-dark-800">
                <img
                  src={req.photoUrl}
                  alt="Hot photo"
                  className={`w-full h-full object-cover pointer-events-none transition-all ${showUnlocked ? '' : 'blur-lg'}`}
                  draggable={false}
                  onContextMenu={e => e.preventDefault()}
                />
              </div>
              <button
                onClick={toggleShow}
                className="w-full py-2 rounded-xl border border-dark-500 text-sm text-dark-200 hover:text-dark-50 flex items-center justify-center gap-2 transition-colors"
              >
                {showUnlocked ? <><EyeOff size={14} /> Ocultar</> : <><Eye size={14} /> Ver Foto</>}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

