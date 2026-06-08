'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ArrowLeft, Wallet, TrendingUp, Heart, Flame, FileText,
  ArrowDownToLine, X, Check, AlertCircle, Building2, Clock
} from 'lucide-react'
import { formatCurrency, timeAgo } from '@/lib/utils'

interface Earning {
  id: string
  amount: number
  type: 'LIKE_RECEIVED' | 'MATCH' | 'HOT_PHOTO_SOLD' | 'CONTENT_POSTED'
  description: string
  createdAt: string
}

interface Withdrawal {
  id: string
  amount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'
  bankDetails: any
  notes?: string
  createdAt: string
}

const TYPE_ICONS: Record<string, { icon: any; color: string }> = {
  LIKE_RECEIVED: { icon: Heart, color: 'text-pink-400' },
  MATCH: { icon: TrendingUp, color: 'text-green-400' },
  HOT_PHOTO_SOLD: { icon: Flame, color: 'text-orange-400' },
  CONTENT_POSTED: { icon: FileText, color: 'text-blue-400' },
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  APPROVED: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  REJECTED: 'text-red-400 bg-red-500/10 border-red-500/20',
  PAID: 'text-green-400 bg-green-500/10 border-green-500/20',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Aguardando',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  PAID: 'Pago',
}

const BANKS = [
  'Nubank', 'Itaú', 'Bradesco', 'Santander', 'Caixa', 'Banco do Brasil',
  'Inter', 'C6 Bank', 'BTG Pactual', 'Sicoob', 'Outro',
]

export default function EarningsPage() {
  const { data: session } = useSession()
  const userId = (session?.user as any)?.id
  const role = (session?.user as any)?.role

  const [earnings, setEarnings] = useState<Earning[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'history' | 'withdrawals'>('history')

  // Withdrawal modal
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [bankForm, setBankForm] = useState({
    bankName: '', agency: '', account: '', accountType: 'CHECKING' as 'CHECKING' | 'SAVINGS',
    pixKey: '', pixKeyType: 'CPF' as 'CPF' | 'PHONE' | 'EMAIL' | 'EVP',
    holderName: '', holderCpf: '',
  })
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')
  const [withdrawSuccess, setWithdrawSuccess] = useState(false)

  useEffect(() => {
    if (role !== 'FEMALE') return
    Promise.all([
      fetch('/api/earnings').then(r => r.json()),
      fetch('/api/withdrawals').then(r => r.json()),
    ]).then(([e, w]) => {
      setEarnings(e.earnings ?? [])
      setTotal(e.total ?? 0)
      setWithdrawals(w.withdrawals ?? [])
    }).finally(() => setLoading(false))

    // Pre-fill user bank details if saved
    fetch(`/api/users/${userId}`).then(r => r.json()).then(d => {
      if (d.user?.bankDetails) {
        setBankForm(f => ({ ...f, ...d.user.bankDetails }))
      }
    })
  }, [role, userId])

  const pendingWithdrawn = withdrawals
    .filter(w => w.status === 'PENDING' || w.status === 'APPROVED')
    .reduce((s, w) => s + w.amount, 0)
  const available = Math.max(0, total - pendingWithdrawn)

  async function handleWithdraw() {
    setWithdrawing(true)
    setWithdrawError('')
    const amount = parseFloat(withdrawAmount.replace(',', '.'))
    if (!amount || amount <= 0 || amount > available) {
      setWithdrawError('Valor inválido ou maior que o saldo disponível.')
      setWithdrawing(false)
      return
    }
    if (!bankForm.holderName || !bankForm.holderCpf) {
      setWithdrawError('Nome e CPF do titular são obrigatórios.')
      setWithdrawing(false)
      return
    }
    const res = await fetch('/api/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, bankDetails: bankForm }),
    })
    const data = await res.json()
    if (!res.ok) {
      setWithdrawError(data.error ?? 'Erro ao solicitar saque.')
    } else {
      setWithdrawals(prev => [data.withdrawal, ...prev])
      setWithdrawSuccess(true)
      setTimeout(() => { setShowWithdraw(false); setWithdrawSuccess(false); setWithdrawAmount('') }, 2500)
    }
    setWithdrawing(false)
  }

  if (role !== 'FEMALE') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 text-center">
        <Wallet size={40} className="text-dark-500" />
        <p className="text-dark-300">Esta página é exclusiva para membros femininas.</p>
        <Link href="/discover" className="bg-gold-500 text-dark-50 font-bold px-6 py-2.5 rounded-full text-sm">
          Voltar
        </Link>
      </div>
    )
  }

  const byType = {
    LIKE_RECEIVED: earnings.filter(e => e.type === 'LIKE_RECEIVED'),
    MATCH: earnings.filter(e => e.type === 'MATCH'),
    HOT_PHOTO_SOLD: earnings.filter(e => e.type === 'HOT_PHOTO_SOLD'),
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <div className="sticky top-0 z-30 bg-dark-800/90 backdrop-blur-lg border-b border-dark-700/60 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/profile" className="text-dark-300 hover:text-dark-50 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-bold">Meus Ganhos</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-5">
        {/* Balance card */}
        <div className="glass rounded-2xl p-6 border border-gold-500/20 gold-glow">
          <p className="text-dark-300 text-sm mb-1 text-center">Saldo Total</p>
          <p className="text-4xl font-bold text-gradient-gold text-center">{formatCurrency(total)}</p>
          <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-dark-700/50">
            <div className="text-center">
              <p className="text-xs text-dark-400">Disponível</p>
              <p className="font-bold text-green-400">{formatCurrency(available)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-dark-400">Em trânsito</p>
              <p className="font-bold text-yellow-400">{formatCurrency(pendingWithdrawn)}</p>
            </div>
          </div>
          <button
            onClick={() => setShowWithdraw(true)}
            disabled={available < 10}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-gold-500 hover:bg-gold-400 text-dark-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDownToLine size={16} />
            Solicitar Saque
          </button>
          {available < 10 && (
            <p className="text-xs text-dark-400 text-center mt-2">Saldo mínimo para saque: R$ 10,00</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Likes', count: byType.LIKE_RECEIVED.length, value: byType.LIKE_RECEIVED.reduce((s, e) => s + e.amount, 0), color: 'pink' },
            { label: 'Matches', count: byType.MATCH.length, value: byType.MATCH.reduce((s, e) => s + e.amount, 0), color: 'green' },
            { label: 'Fotos Exclusivas', count: byType.HOT_PHOTO_SOLD.length, value: byType.HOT_PHOTO_SOLD.reduce((s, e) => s + e.amount, 0), color: 'orange' },
          ].map(s => (
            <div key={s.label} className="glass rounded-xl p-4 border border-dark-600 text-center">
              <p className="text-xs text-dark-400 mb-1">{s.label}</p>
              <p className="text-lg font-bold text-dark-50">{s.count}</p>
              <p className={`text-xs font-semibold text-${s.color}-400 mt-0.5`}>{formatCurrency(s.value)}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-dark-700/50 border border-dark-600/60 p-1">
          {(['history', 'withdrawals'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-dark-800 text-dark-50 shadow' : 'text-dark-300 hover:text-dark-50'}`}>
              {t === 'history' ? 'Histórico de Ganhos' : `Saques (${withdrawals.length})`}
            </button>
          ))}
        </div>

        {/* Earning rates */}
        {tab === 'history' && (
          <div className="glass rounded-xl p-5 border border-dark-600">
            <h3 className="font-semibold text-xs text-dark-400 uppercase tracking-wider mb-3">Como você ganha</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Por cada curtida recebida', amount: 0.50, icon: Heart, color: 'text-pink-400' },
                { label: 'Por cada match', amount: 2.00, icon: TrendingUp, color: 'text-green-400' },
                { label: 'Por foto exclusiva vendida', amount: null, icon: Flame, color: 'text-orange-400', note: 'Valor da venda' },
              ].map(({ label, amount, icon: Icon, color, note }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={15} className={color} />
                    <span className="text-sm text-dark-200">{label}</span>
                  </div>
                  <span className={`text-sm font-bold ${color}`}>
                    {note ?? `+${formatCurrency(amount!)}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History list */}
        {tab === 'history' && (
          <div>
            <h3 className="font-semibold text-sm text-dark-300 mb-3">Transações</h3>
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-dark-800 animate-pulse" />)}</div>
            ) : earnings.length === 0 ? (
              <div className="text-center py-12 text-dark-400">
                <Wallet size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum ganho ainda.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {earnings.map(e => {
                  const cfg = TYPE_ICONS[e.type] ?? TYPE_ICONS.LIKE_RECEIVED
                  const Icon = cfg.icon
                  return (
                    <div key={e.id} className="flex items-center gap-3 bg-dark-800 rounded-xl px-4 py-3 border border-dark-600">
                      <div className={`w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center shrink-0 ${cfg.color}`}>
                        <Icon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-dark-50 font-medium">{e.description}</p>
                        <p className="text-xs text-dark-400">{timeAgo(e.createdAt)}</p>
                      </div>
                      <span className="text-sm font-bold text-green-400 shrink-0">+{formatCurrency(e.amount)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Withdrawals list */}
        {tab === 'withdrawals' && (
          <div className="space-y-3">
            {withdrawals.length === 0 ? (
              <div className="text-center py-12 text-dark-400">
                <ArrowDownToLine size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma solicitação de saque ainda.</p>
              </div>
            ) : (
              withdrawals.map(w => (
                <div key={w.id} className="bg-dark-800 rounded-xl p-4 border border-dark-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-dark-300" />
                      <span className="font-bold">{formatCurrency(w.amount)}</span>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[w.status]}`}>
                      {STATUS_LABELS[w.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-dark-400">
                    <Clock size={11} />
                    {timeAgo(w.createdAt)} · {w.bankDetails?.bankName} · {w.bankDetails?.pixKey ? `Pix: ${w.bankDetails.pixKey}` : w.bankDetails?.account}
                  </div>
                  {w.notes && w.status === 'REJECTED' && (
                    <p className="text-xs text-red-400">{w.notes}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Withdrawal modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass rounded-2xl border border-dark-500/60 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-dark-600/60 sticky top-0 bg-dark-800/95 backdrop-blur-lg rounded-t-2xl">
              <h3 className="font-bold flex items-center gap-2"><ArrowDownToLine size={16} className="text-gold-400" />Solicitar Saque</h3>
              <button onClick={() => setShowWithdraw(false)} className="text-dark-300 hover:text-dark-50"><X size={20} /></button>
            </div>

            <div className="p-5 space-y-4">
              {withdrawSuccess ? (
                <div className="text-center py-8">
                  <Check size={40} className="text-green-400 mx-auto mb-3" />
                  <p className="font-bold text-green-400">Solicitação enviada!</p>
                  <p className="text-sm text-dark-300 mt-1">Nossa equipe processará em até 2 dias úteis.</p>
                </div>
              ) : (
                <>
                  {/* Amount */}
                  <div>
                    <label className="text-xs text-dark-400 mb-1.5 block">Valor do saque (disponível: {formatCurrency(available)})</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 text-sm">R$</span>
                      <input
                        value={withdrawAmount}
                        onChange={e => setWithdrawAmount(e.target.value)}
                        placeholder="0,00"
                        className="w-full bg-dark-700 border border-dark-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-dark-50 focus:outline-none focus:border-gold-500/40"
                      />
                    </div>
                  </div>

                  <div className="border-t border-dark-600/50 pt-4">
                    <p className="text-xs text-dark-400 uppercase tracking-wider mb-3">Dados bancários / PIX</p>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-dark-400 mb-1 block">Nome do titular</label>
                          <input value={bankForm.holderName} onChange={e => setBankForm(f => ({ ...f, holderName: e.target.value }))}
                            className="w-full bg-dark-700 border border-dark-500 rounded-xl px-3 py-2 text-sm text-dark-50 focus:outline-none focus:border-gold-500/40" />
                        </div>
                        <div>
                          <label className="text-xs text-dark-400 mb-1 block">CPF do titular</label>
                          <input value={bankForm.holderCpf} onChange={e => setBankForm(f => ({ ...f, holderCpf: e.target.value }))}
                            placeholder="000.000.000-00"
                            className="w-full bg-dark-700 border border-dark-500 rounded-xl px-3 py-2 text-sm text-dark-50 focus:outline-none focus:border-gold-500/40" />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-dark-400 mb-1 block">Banco</label>
                        <select value={bankForm.bankName} onChange={e => setBankForm(f => ({ ...f, bankName: e.target.value }))}
                          className="w-full bg-dark-700 border border-dark-500 rounded-xl px-3 py-2 text-sm text-dark-50 focus:outline-none focus:border-gold-500/40">
                          <option value="">Selecione</option>
                          {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-dark-400 mb-1 block">Agência</label>
                          <input value={bankForm.agency} onChange={e => setBankForm(f => ({ ...f, agency: e.target.value }))}
                            placeholder="0000"
                            className="w-full bg-dark-700 border border-dark-500 rounded-xl px-3 py-2 text-sm text-dark-50 focus:outline-none focus:border-gold-500/40" />
                        </div>
                        <div>
                          <label className="text-xs text-dark-400 mb-1 block">Conta</label>
                          <input value={bankForm.account} onChange={e => setBankForm(f => ({ ...f, account: e.target.value }))}
                            placeholder="00000-0"
                            className="w-full bg-dark-700 border border-dark-500 rounded-xl px-3 py-2 text-sm text-dark-50 focus:outline-none focus:border-gold-500/40" />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-dark-400 mb-1 block">Chave PIX (opcional)</label>
                        <div className="flex gap-2">
                          <select value={bankForm.pixKeyType} onChange={e => setBankForm(f => ({ ...f, pixKeyType: e.target.value as any }))}
                            className="bg-dark-700 border border-dark-500 rounded-xl px-3 py-2 text-sm text-dark-50 focus:outline-none focus:border-gold-500/40 w-24 shrink-0">
                            <option value="CPF">CPF</option>
                            <option value="PHONE">Tel</option>
                            <option value="EMAIL">Email</option>
                            <option value="EVP">Aleatória</option>
                          </select>
                          <input value={bankForm.pixKey} onChange={e => setBankForm(f => ({ ...f, pixKey: e.target.value }))}
                            placeholder="Chave PIX"
                            className="flex-1 bg-dark-700 border border-dark-500 rounded-xl px-3 py-2 text-sm text-dark-50 focus:outline-none focus:border-gold-500/40" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {withdrawError && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
                      <AlertCircle size={15} />
                      {withdrawError}
                    </div>
                  )}

                  <button onClick={handleWithdraw} disabled={withdrawing}
                    className="w-full py-3 rounded-xl font-bold bg-gold-500 hover:bg-gold-400 text-dark-50 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                    {withdrawing
                      ? <div className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                      : <><ArrowDownToLine size={16} />Solicitar Saque</>
                    }
                  </button>
                  <p className="text-xs text-dark-400 text-center">Processamento em até 2 dias úteis</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

