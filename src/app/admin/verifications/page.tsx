'use client'

import { useState, useEffect } from 'react'
import { Shield, CheckCircle, XCircle, Clock, User } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

interface Verif {
  id: string
  userId: string
  documentUrl?: string
  selfieUrl?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  reviewedAt?: string
  rejectionReason?: string
  user: { id: string; name: string; email: string; photos: string[] } | null
}

export default function VerificationsPage() {
  const [verifs, setVerifs] = useState<Verif[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [rejectModal, setRejectModal] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [acting, setActing] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/admin/verifications')
    const data = await res.json()
    if (data.verifications) setVerifs(data.verifications)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function approve(id: string) {
    setActing(id)
    await fetch('/api/admin/verifications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'approve' }),
    })
    await load(); setActing(null)
  }

  async function reject(id: string) {
    setActing(id)
    await fetch('/api/admin/verifications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'reject', rejectionReason: rejectReason }),
    })
    setRejectModal(null); setRejectReason('')
    await load(); setActing(null)
  }

  const filtered = verifs.filter(v => filter === 'ALL' || v.status === filter)

  const statusBadge = (s: string) => {
    if (s === 'PENDING') return <span className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full text-xs"><Clock size={10} />Pendente</span>
    if (s === 'APPROVED') return <span className="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full text-xs"><CheckCircle size={10} />Aprovado</span>
    return <span className="flex items-center gap-1 text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full text-xs"><XCircle size={10} />Rejeitado</span>
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-lg border-b border-dark-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <h1 className="text-xl font-bold">Verificações</h1>
          <div className="flex gap-2">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' : 'text-dark-300 hover:text-white'}`}>
                {f === 'ALL' ? 'Todos' : f === 'PENDING' ? 'Pendentes' : f === 'APPROVED' ? 'Aprovados' : 'Rejeitados'}
                {f === 'PENDING' && <span className="ml-1 bg-yellow-500/20 text-yellow-400 px-1 rounded">
                  {verifs.filter(v => v.status === 'PENDING').length}
                </span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-dark-800 animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-dark-400">
            <Shield size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhuma verificação {filter !== 'ALL' ? filter.toLowerCase() : ''}</p>
          </div>
        ) : (
          filtered.map(v => (
            <div key={v.id} className="p-5 rounded-2xl bg-dark-800 border border-dark-600">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-dark-700 shrink-0">
                  {v.user?.photos[0] ? (
                    <img src={v.user.photos[0]} alt={v.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><User size={20} className="text-dark-400" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-bold">{v.user?.name ?? 'Usuário Removido'}</p>
                    {statusBadge(v.status)}
                  </div>
                  <p className="text-xs text-dark-400">{v.user?.email} · Enviado {timeAgo(v.createdAt)}</p>
                  {v.rejectionReason && (
                    <p className="text-xs text-red-400 mt-1">Motivo: {v.rejectionReason}</p>
                  )}
                </div>
                {v.status === 'PENDING' && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => approve(v.id)} disabled={acting === v.id}
                      className="flex items-center gap-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/20 px-3 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50">
                      {acting === v.id ? <div className="w-3 h-3 border border-green-400/30 border-t-green-400 rounded-full animate-spin" /> : <CheckCircle size={14} />}
                      Aprovar
                    </button>
                    <button onClick={() => setRejectModal(v.id)}
                      className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20 px-3 py-2 rounded-xl text-xs font-medium transition-colors">
                      <XCircle size={14} />Rejeitar
                    </button>
                  </div>
                )}
              </div>

              {(v.documentUrl || v.selfieUrl) && (
                <div className="mt-4 flex gap-3">
                  {v.documentUrl && (
                    <div className="flex-1">
                      <p className="text-xs text-dark-400 mb-1">Documento</p>
                      <div className="h-24 rounded-lg bg-dark-700 overflow-hidden">
                        <img src={v.documentUrl} alt="Documento" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                      </div>
                    </div>
                  )}
                  {v.selfieUrl && (
                    <div className="flex-1">
                      <p className="text-xs text-dark-400 mb-1">Selfie</p>
                      <div className="h-24 rounded-lg bg-dark-700 overflow-hidden">
                        <img src={v.selfieUrl} alt="Selfie" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass rounded-2xl p-6 border border-red-500/20 w-full max-w-md">
            <h3 className="font-bold mb-4">Motivo da Rejeição</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Descreva o motivo da rejeição..." rows={3}
              className="w-full bg-dark-800 border border-dark-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="flex-1 border border-dark-500 text-dark-200 py-2.5 rounded-xl text-sm hover:bg-dark-700 transition-colors">
                Cancelar
              </button>
              <button onClick={() => reject(rejectModal)}
                className="flex-1 bg-red-500/80 hover:bg-red-500 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
                Rejeitar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
