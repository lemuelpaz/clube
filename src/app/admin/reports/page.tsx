'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, X, Shield, Clock } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

interface ReportData {
  id: string
  reason: string
  description?: string
  status: string
  createdAt: string
  reporter: { id: string; name: string; email: string; photos: string[] } | null
  reported: { id: string; name: string; email: string; photos: string[]; role: string } | null
}

const REASON_LABELS: Record<string, string> = {
  FAKE_PROFILE: 'Perfil falso',
  INAPPROPRIATE_CONTENT: 'Conteúdo inapropriado',
  HARASSMENT: 'Assédio',
  SCAM: 'Golpe / Fraude',
  UNDERAGE: 'Menor de idade',
  OTHER: 'Outro',
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED' | 'DISMISSED'>('PENDING')
  const [acting, setActing] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/admin/reports')
    const data = await res.json()
    if (data.reports) setReports(data.reports)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAction(reportId: string, action: 'resolve' | 'dismiss') {
    setActing(reportId)
    await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, action }),
    })
    await load()
    setActing(null)
  }

  const filtered = filter === 'ALL' ? reports : reports.filter(r => r.status === filter)

  const counts = {
    ALL: reports.length,
    PENDING: reports.filter(r => r.status === 'PENDING').length,
    RESOLVED: reports.filter(r => r.status === 'RESOLVED').length,
    DISMISSED: reports.filter(r => r.status === 'DISMISSED').length,
  }

  const statusBadge = (s: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      PENDING: { label: 'Pendente', cls: 'bg-yellow-400/10 text-yellow-400' },
      RESOLVED: { label: 'Resolvida', cls: 'bg-green-400/10 text-green-400' },
      DISMISSED: { label: 'Ignorada', cls: 'bg-dark-500/40 text-dark-400' },
    }
    const { label, cls } = map[s] ?? { label: s, cls: '' }
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-lg border-b border-dark-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <h1 className="text-xl font-bold">Denúncias</h1>
          <span className="text-sm text-dark-400">{counts.PENDING} pendente{counts.PENDING !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['PENDING', 'ALL', 'RESOLVED', 'DISMISSED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${filter === f
                ? 'bg-gold-500/20 text-gold-400 border-gold-500/30'
                : 'bg-dark-800 border-dark-600 text-dark-300 hover:text-dark-50'
              }`}
            >
              {{ ALL: 'Todas', PENDING: 'Pendentes', RESOLVED: 'Resolvidas', DISMISSED: 'Ignoradas' }[f]}
              <span className="ml-1.5 text-xs opacity-60">({counts[f]})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-dark-800 border border-dark-600 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-dark-400">
            <AlertTriangle size={40} className="mb-3 opacity-30" />
            <p>Nenhuma denúncia {filter !== 'ALL' ? `com status "${({ PENDING: 'Pendente', RESOLVED: 'Resolvida', DISMISSED: 'Ignorada' }[filter])}"` : 'registrada'}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => (
              <div key={r.id} className="bg-dark-800 border border-dark-600 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  {/* Reported user */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-dark-600 shrink-0">
                      {r.reported?.photos?.[0] ? (
                        <img src={r.reported.photos[0]} alt={r.reported.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gold-400">
                          {r.reported?.name?.[0] ?? '?'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold truncate">{r.reported?.name ?? 'Usuário removido'}</p>
                        {r.reported?.role && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${r.reported.role === 'MALE' ? 'bg-blue-400/10 text-blue-400' : 'bg-pink-400/10 text-pink-400'}`}>
                            {r.reported.role === 'MALE' ? 'Homem' : 'Mulher'}
                          </span>
                        )}
                        {statusBadge(r.status)}
                      </div>
                      <p className="text-xs text-dark-400 truncate">{r.reported?.email ?? '—'}</p>
                    </div>
                  </div>

                  <div className="text-xs text-dark-500 shrink-0 flex items-center gap-1">
                    <Clock size={11} />
                    {timeAgo(r.createdAt)}
                  </div>
                </div>

                {/* Reason + description */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-medium">
                      {REASON_LABELS[r.reason] ?? r.reason}
                    </span>
                  </div>
                  {r.description && (
                    <p className="text-sm text-dark-200 bg-dark-700/60 rounded-xl px-3 py-2 italic">
                      "{r.description}"
                    </p>
                  )}
                </div>

                {/* Reporter */}
                <div className="mt-3 flex items-center gap-2 text-xs text-dark-400 border-t border-dark-700/60 pt-3">
                  <Shield size={11} className="shrink-0" />
                  <span>Denunciado por: <span className="text-dark-200">{r.reporter?.name ?? 'Usuário removido'}</span> · {r.reporter?.email ?? ''}</span>
                </div>

                {/* Actions */}
                {r.status === 'PENDING' && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleAction(r.id, 'resolve')}
                      disabled={acting === r.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-xs font-medium transition-colors disabled:opacity-40"
                    >
                      <CheckCircle size={13} />
                      Resolver
                    </button>
                    <button
                      onClick={() => handleAction(r.id, 'dismiss')}
                      disabled={acting === r.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-700 hover:bg-dark-600 border border-dark-500 text-dark-300 text-xs font-medium transition-colors disabled:opacity-40"
                    >
                      <X size={13} />
                      Ignorar
                    </button>
                    {acting === r.id && (
                      <div className="w-4 h-4 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin self-center ml-1" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
