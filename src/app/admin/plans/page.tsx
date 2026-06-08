'use client'

import { useState, useEffect } from 'react'
import { Crown, Save, RotateCcw, CheckCircle, AlertCircle, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PlanPrice {
  plan: string
  price: number
  label: string
  durationDays: number
}

const PLAN_ORDER = ['MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL']
const PLAN_DEFAULTS: Record<string, number> = {
  MONTHLY: 149.90,
  QUARTERLY: 399.90,
  SEMIANNUAL: 699.90,
  ANNUAL: 1199.90,
}

export default function AdminPlansPage() {
  const [prices, setPrices] = useState<PlanPrice[]>([])
  const [edited, setEdited] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/plans')
      .then(r => r.json())
      .then(d => {
        if (d.prices) {
          setPrices(d.prices)
          const init: Record<string, string> = {}
          for (const p of d.prices) init[p.plan] = p.price.toFixed(2)
          setEdited(init)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function handleChange(plan: string, val: string) {
    setEdited(prev => ({ ...prev, [plan]: val }))
    setStatus('idle')
  }

  async function handleSave() {
    setSaving(true)
    setStatus('idle')
    setErrorMsg('')
    try {
      const body: Record<string, number> = {}
      for (const [plan, val] of Object.entries(edited)) {
        const n = parseFloat(val)
        if (isNaN(n) || n <= 0) {
          setErrorMsg(`Valor inválido para ${plan}`)
          setStatus('error')
          setSaving(false)
          return
        }
        body[plan] = n
      }

      const res = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Erro ao salvar')
        setStatus('error')
      } else {
        setPrices(data.prices)
        setStatus('success')
        setTimeout(() => setStatus('idle'), 3000)
      }
    } catch {
      setErrorMsg('Erro de conexão')
      setStatus('error')
    }
    setSaving(false)
  }

  function resetToDefaults() {
    const reset: Record<string, string> = {}
    for (const plan of PLAN_ORDER) reset[plan] = PLAN_DEFAULTS[plan].toFixed(2)
    setEdited(reset)
    setStatus('idle')
  }

  const sortedPrices = [...prices].sort((a, b) => PLAN_ORDER.indexOf(a.plan) - PLAN_ORDER.indexOf(b.plan))

  return (
    <div className="min-h-screen pb-8">
      <div className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-lg border-b border-dark-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Preços dos Planos</h1>
            <p className="text-sm text-dark-400 mt-0.5">Ajuste os valores cobrados nas assinaturas</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefaults}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-dark-700 hover:bg-dark-600 text-sm text-dark-200 transition-colors"
            >
              <RotateCcw size={14} /> Redefinir
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-dark-900 font-bold text-sm transition-colors gold-glow"
            >
              {saving
                ? <div className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                : <><Save size={14} /> Salvar Preços</>
              }
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto space-y-4">

        {/* Status messages */}
        {status === 'success' && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-green-400">
            <CheckCircle size={18} /> Preços atualizados com sucesso!
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
            <AlertCircle size={18} /> {errorMsg}
          </div>
        )}

        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-dark-800 animate-pulse" />
          ))
        ) : (
          sortedPrices.map(plan => {
            const currentVal = edited[plan.plan] ?? plan.price.toFixed(2)
            const parsed = parseFloat(currentVal)
            const changed = Math.abs(parsed - plan.price) > 0.001

            return (
              <div key={plan.plan}
                className={`p-5 rounded-2xl bg-dark-800 border transition-all ${changed ? 'border-gold-500/40' : 'border-dark-600'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center shrink-0">
                      <Crown size={18} className="text-gold-400" />
                    </div>
                    <div>
                      <p className="font-bold">{plan.label}</p>
                      <p className="text-xs text-dark-400">{plan.durationDays} dias de acesso</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-dark-400 text-sm">R$</span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={currentVal}
                      onChange={e => handleChange(plan.plan, e.target.value)}
                      className="w-28 bg-dark-700 border border-dark-500 focus:border-gold-500 rounded-xl px-3 py-2 text-right font-bold text-lg text-white outline-none transition-colors"
                    />
                  </div>
                </div>
                {changed && !isNaN(parsed) && (
                  <div className="mt-3 pt-3 border-t border-dark-600 flex items-center justify-between text-xs text-dark-400">
                    <span>Preço anterior: <span className="line-through">{formatCurrency(plan.price)}</span></span>
                    <span className="text-gold-400 font-medium">Novo: {formatCurrency(parsed)}</span>
                  </div>
                )}
              </div>
            )
          })
        )}

        <div className="glass rounded-2xl p-5 border border-dark-600 mt-6">
          <div className="flex items-start gap-3">
            <DollarSign size={18} className="text-gold-400 shrink-0 mt-0.5" />
            <div className="text-sm text-dark-300 space-y-1">
              <p className="font-medium text-white">Como funciona</p>
              <p>Os preços definidos aqui são usados no checkout de assinatura. Alterações entram em vigor imediatamente para novos pagamentos.</p>
              <p>Assinaturas já ativas não são afetadas pela mudança de preço.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
