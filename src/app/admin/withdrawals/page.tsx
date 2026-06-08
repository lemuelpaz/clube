'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, X, Building2, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrency, timeAgo } from '@/lib/utils'

interface WithdrawalRow {
  id: string
  userId: string
  userName: string
  userEmail: string
  amount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'
  bankDetails: {
    bankName: string
    agency: string
    account: string
    accountType: string
    pixKey?: string
    pixKeyType?: string
    holderName: string
    holderCpf: string
  }
  notes?: string
  createdAt: string
  reviewedAt?: string
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  APPROVED: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  REJECTED: 'text-red-400 bg-red-500/10 border-red-500/30',
  PAID: 'text-green-400 bg-green-500/10 border-green-500/30',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Aguardando',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  PAID: 'Pago',
}

export default function AdminWithdrawalsPage() {
  const [list, setList] = useState<WithdrawalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('PENDING')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/withdrawals').then(r => r.json()).then(d => {
      setList(d.withdrawals ?? [])
      setLoading(false)
    })
  }, [])

  async function act(id: string, action: 'approve' | 'reject' | 'mark_paid') {
    setProcessing(id)
    const res = await fetch('/api/admin/withdrawals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, notes: notes[id] }),
    })
    if (res.ok) {
      const statusMap = { approve: 'APPROVED', reject: 'REJECTED', mark_paid: 'PAID' } as const
      setList(prev => prev.map(w => w.id === id ? { ...w, status: statusMap[action], notes: notes[id] } : w))
    }
    setProcessing(null)
  }

  const filtered = filter === 'ALL' ? list : list.filter(w => w.status === filter)
  const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0, PAID: 0, ALL: list.length }
  list.forEach(w => { counts[w.status]++ })

  return (
    <div className="min-h-screen pb-8">
      <div className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-lg border-b border-dark-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-dark-300 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">Saques</h1>
          {counts.PENDING > 0 && (
            <span className="bg-yellow-500 text-dark-900 text-xs font-bold px-2 py-0.5 rounded-full">{counts.PENDING}</span>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-5">
        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['PENDING', 'APPROVED', 'PAID', 'REJECTED', 'ALL'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${filter === s ? 'bg-gold-500/20 border-gold-500/50 text-gold-400' : 'border-dark-600 text-dark-300 hover:border-dark-400'}`}>
              {s === 'ALL' ? 'Todos' : STATUS_LABEL[s]} ({counts[s]})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-dark-800 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-dark-400">
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum saque {filter !== 'ALL' ? STATUS_LABEL[filter].toLowerCase() : ''}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(w => (
              <div key={w.id} className="bg-dark-800 rounded-2xl border border-dark-600 overflow-hidden">
                {/* Row header */}
                <button className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-dark-700/30 transition-colors"
                  onClick={() => setExpanded(expanded === w.id ? null : w.id)}>
                  <Building2 size={18} className="text-dark-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{formatCurrency(w.amount)}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLE[w.status]}`}>
                        {STATUS_LABEL[w.status]}
                      </span>
                    </div>
                    <p className="text-xs text-dark-400 mt-0.5">{w.userName} · {timeAgo(w.createdAt)}</p>
                  </div>
                  {expanded === w.id ? <ChevronUp size={16} className="text-dark-400 shrink-0" /> : <ChevronDown size={16} className="text-dark-400 shrink-0" />}
                </button>

                {/* Expanded details */}
                {expanded === w.id && (
                  <div className="px-5 pb-5 space-y-4 border-t border-dark-700/50">
                    <div className="grid grid-cols-2 gap-3 pt-4 text-sm">
                      <div>
                        <p className="text-xs text-dark-400 mb-0.5">Usuária</p>
                        <p className="font-medium">{w.userName}</p>
                        <p className="text-xs text-dark-400">{w.userEmail}</p>
                      </div>
                      <div>
                        <p className="text-xs text-dark-400 mb-0.5">Data</p>
                        <div className="flex items-center gap-1 text-dark-200">
                          <Clock size={12} />
                          {new Date(w.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>

                    <div className="bg-dark-700/50 rounded-xl p-4 text-sm space-y-1.5">
                      <p className="text-xs text-dark-400 font-medium uppercase tracking-wider mb-2">Dados bancários</p>
                      <p><span className="text-dark-400">Titular:</span> {w.bankDetails.holderName} · {w.bankDetails.holderCpf}</p>
                      <p><span className="text-dark-400">Banco:</span> {w.bankDetails.bankName}</p>
                      <p><span className="text-dark-400">Agência:</span> {w.bankDetails.agency} · <span className="text-dark-400">Conta:</span> {w.bankDetails.account} ({w.bankDetails.accountType === 'CHECKING' ? 'Corrente' : 'Poupança'})</p>
                      {w.bankDetails.pixKey && (
                        <p><span className="text-dark-400">Chave PIX ({w.bankDetails.pixKeyType}):</span> {w.bankDetails.pixKey}</p>
                      )}
                    </div>

                    {w.status === 'PENDING' && (
                      <div className="space-y-3">
                        <textarea
                          value={notes[w.id] ?? ''}
                          onChange={e => setNotes(n => ({ ...n, [w.id]: e.target.value }))}
                          placeholder="Observações (opcional para aprovação, obrigatório para rejeição)"
                          rows={2}
                          className="w-full bg-dark-700 border border-dark-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none resize-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => act(w.id, 'approve')} disabled={processing === w.id}
                            className="flex-1 py-2.5 rounded-xl font-bold bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30 flex items-center justify-center gap-1.5 transition-colors text-sm disabled:opacity-50">
                            {processing === w.id ? <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" /> : <><Check size={14} />Aprovar</>}
                          </button>
                          <button onClick={() => act(w.id, 'reject')} disabled={processing === w.id}
                            className="flex-1 py-2.5 rounded-xl font-bold bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 flex items-center justify-center gap-1.5 transition-colors text-sm disabled:opacity-50">
                            <X size={14} />Rejeitar
                          </button>
                        </div>
                      </div>
                    )}

                    {w.status === 'APPROVED' && (
                      <button onClick={() => act(w.id, 'mark_paid')} disabled={processing === w.id}
                        className="w-full py-2.5 rounded-xl font-bold bg-gold-500/20 border border-gold-500/40 text-gold-400 hover:bg-gold-500/30 flex items-center justify-center gap-2 transition-colors text-sm disabled:opacity-50">
                        {processing === w.id ? <div className="w-4 h-4 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" /> : <><Check size={14} />Marcar como Pago</>}
                      </button>
                    )}

                    {w.notes && (
                      <p className="text-xs text-dark-400 italic">Obs: {w.notes}</p>
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
