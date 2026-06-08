'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
  Crown, CheckCircle, Copy, Check, QrCode, RefreshCw,
  AlertCircle, Tag, X, Loader2,
} from 'lucide-react'
import { formatCurrency, PLAN_NAMES } from '@/lib/utils'

type Plan = 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL'
type Step = 'plans' | 'pix' | 'done'

interface PlanConfig {
  id: Plan
  label: string
  price: number
  period: string
  durationDays: number
  saving?: string
  popular?: boolean
}

interface ActiveSub {
  id: string; plan: Plan; status: string
  startDate: string; endDate: string; amount: number
}

interface PromoResult {
  valid: boolean; error?: string
  promoId?: string; code?: string; description?: string
  discountType?: string; discountValue?: number
  discountAmount?: number; basePrice?: number; finalPrice?: number
}

const DEFAULT_PLANS: PlanConfig[] = [
  { id: 'MONTHLY', label: 'Mensal', price: 149.90, period: 'mês', durationDays: 30 },
  { id: 'QUARTERLY', label: 'Trimestral', price: 399.90, period: '3 meses', durationDays: 90, saving: 'Economize R$ 50' },
  { id: 'SEMIANNUAL', label: 'Semestral', price: 699.90, period: '6 meses', durationDays: 180, saving: 'Economize R$ 200', popular: true },
  { id: 'ANNUAL', label: 'Anual', price: 1199.90, period: 'ano', durationDays: 365, saving: 'Economize R$ 600' },
]

const features = [
  'Visualizar todos os perfis verificados',
  'Curtir e fazer matches ilimitados',
  'Enviar e receber mensagens',
  'Filtros avançados de busca',
  'Ver quem visitou seu perfil',
  'Favoritar perfis',
  'Solicitar fotos exclusivas',
  'Suporte prioritário',
]

export default function SubscriptionPage() {
  const { data: session } = useSession()
  const user = session?.user as any

  const [plans, setPlans] = useState<PlanConfig[]>(DEFAULT_PLANS)
  const [active, setActive] = useState<ActiveSub | null>(null)
  const [selected, setSelected] = useState<Plan>('SEMIANNUAL')
  const [step, setStep] = useState<Step>('plans')
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Promo code
  const [promoCode, setPromoCode] = useState('')
  const [promoInput, setPromoInput] = useState('')
  const [promo, setPromo] = useState<PromoResult | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)

  // PIX state
  const [pixData, setPixData] = useState<{
    chargeId: string; qrCodeImage?: string
    qrCodeText: string; amount: number; basePrice?: number; discount?: number; expiresAt?: string
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [polling, setPolling] = useState(false)
  const [pixError, setPixError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/subscriptions').then(r => r.json()),
      fetch('/api/admin/plans').then(r => r.json()).catch(() => null),
    ]).then(([subData, plansData]) => {
      if (subData.active) setActive(subData.active)
      if (plansData?.prices?.length) {
        const planMap: Record<string, number> = {}
        for (const p of plansData.prices) planMap[p.plan] = p.price
        setPlans(DEFAULT_PLANS.map(p => ({ ...p, price: planMap[p.id] ?? p.price })))
      }
      setLoadingData(false)
    })
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  async function applyPromo() {
    if (!promoInput.trim()) return
    setPromoLoading(true)
    setPromo(null)
    try {
      const res = await fetch(`/api/promotions/validate?code=${encodeURIComponent(promoInput)}&plan=${selected}`)
      const d: PromoResult = await res.json()
      setPromo(d)
      if (d.valid) setPromoCode(promoInput.toUpperCase().trim())
    } catch {
      setPromo({ valid: false, error: 'Erro ao validar cupom' })
    }
    setPromoLoading(false)
  }

  function removePromo() {
    setPromo(null)
    setPromoCode('')
    setPromoInput('')
  }

  function handlePlanSelect(id: Plan) {
    setSelected(id)
    if (promo?.valid) {
      setPromo(null)
      setPromoCode('')
    }
  }

  const selectedPlan = plans.find(p => p.id === selected)!
  const finalPrice = promo?.valid && promo.finalPrice !== undefined ? promo.finalPrice : selectedPlan?.price ?? 0

  async function handleGeneratePix() {
    setLoading(true)
    setPixError('')
    try {
      const res = await fetch('/api/payments/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selected, promoCode: promoCode || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPixError(data.error ?? 'Erro ao gerar PIX')
        setLoading(false)
        return
      }
      setPixData({
        chargeId: data.chargeId,
        qrCodeImage: data.qrCodeImage,
        qrCodeText: data.qrCodeText,
        amount: data.amount,
        basePrice: data.basePrice,
        discount: data.discount,
        expiresAt: data.expiresAt,
      })
      setStep('pix')
      startPolling(data.chargeId)
    } catch {
      setPixError('Erro de conexão. Tente novamente.')
    }
    setLoading(false)
  }

  function startPolling(chargeId: string) {
    setPolling(true)
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/pix/${chargeId}`)
        const data = await res.json()
        if (data.paid) {
          clearInterval(pollRef.current!)
          setPolling(false)
          setStep('done')
          setActive(prev => prev ?? {
            id: chargeId, plan: selected, status: 'ACTIVE',
            startDate: new Date().toISOString(), endDate: '', amount: pixData?.amount ?? 0,
          })
        }
      } catch {}
    }, 5000)
  }

  async function copyCode() {
    if (!pixData?.qrCodeText) return
    await navigator.clipboard.writeText(pixData.qrCodeText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (user?.role !== 'MALE') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <Crown className="text-gold-400 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold mb-2">Conta Gratuita</h2>
          <p className="text-dark-300">Mulheres têm acesso gratuito após a verificação.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <div className="sticky top-0 z-30 bg-dark-800/90 backdrop-blur-lg border-b border-dark-700/60 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {step !== 'plans' && (
            <button
              onClick={() => { setStep('plans'); setPixError(''); if (pollRef.current) clearInterval(pollRef.current) }}
              className="text-dark-300 hover:text-white text-sm transition-colors"
            >← Voltar</button>
          )}
          <h1 className="text-xl font-bold">Assinatura</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">

        {/* Active subscription banner */}
        {!loadingData && active && active.status === 'ACTIVE' && (
          <div className="glass rounded-2xl p-5 border border-gold-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-500/20 flex items-center justify-center shrink-0">
                <Crown className="text-gold-400" size={20} />
              </div>
              <div className="flex-1">
                <p className="font-bold">Assinatura Ativa — Plano {PLAN_NAMES[active.plan]}</p>
                <p className="text-xs text-dark-300">Vence em {new Date(active.endDate).toLocaleDateString('pt-BR')}</p>
              </div>
              <CheckCircle size={20} className="text-green-400 shrink-0" />
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-dark-700">
              <div className="h-1.5 rounded-full bg-gold-500 transition-all"
                style={{ width: `${Math.max(2, Math.min(100, ((new Date(active.endDate).getTime() - Date.now()) / (new Date(active.endDate).getTime() - new Date(active.startDate).getTime())) * 100))}%` }} />
            </div>
          </div>
        )}

        {/* STEP: Plans */}
        {step === 'plans' && (
          <>
            <div>
              <h2 className="text-lg font-bold mb-4">Escolha seu Plano</h2>
              <div className="space-y-3">
                {plans.map(plan => (
                  <button key={plan.id} onClick={() => handlePlanSelect(plan.id)}
                    className={`w-full p-4 rounded-xl border transition-all text-left ${selected === plan.id ? 'border-gold-500 bg-gold-500/10' : 'border-dark-600 bg-dark-800 hover:border-gold-500/30'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selected === plan.id ? 'border-gold-500' : 'border-dark-400'}`}>
                          {selected === plan.id && <div className="w-2 h-2 rounded-full bg-gold-500" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{plan.label}</span>
                            {plan.popular && <span className="text-xs bg-gold-500/20 text-gold-400 px-2 py-0.5 rounded-full font-medium">Popular</span>}
                          </div>
                          {plan.saving && <p className="text-xs text-green-400">{plan.saving}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gradient-gold">{formatCurrency(plan.price)}</p>
                        <p className="text-xs text-dark-400">/{plan.period}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Promo code input */}
              <div className="mt-5">
                {promo?.valid ? (
                  <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                    <Tag size={16} className="text-green-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-green-400">{promo.code}</p>
                      {promo.description && <p className="text-xs text-green-300/70">{promo.description}</p>}
                      <p className="text-xs text-green-300/80">
                        Desconto de {formatCurrency(promo.discountAmount ?? 0)} aplicado
                      </p>
                    </div>
                    <button onClick={removePromo} className="p-1 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                      <input
                        value={promoInput}
                        onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromo(null) }}
                        onKeyDown={e => e.key === 'Enter' && applyPromo()}
                        placeholder="Código de desconto"
                        className="w-full bg-dark-800 border border-dark-600 focus:border-gold-500/50 rounded-xl pl-9 pr-4 py-2.5 text-sm uppercase tracking-wider outline-none transition-colors placeholder:normal-case placeholder:tracking-normal"
                      />
                    </div>
                    <button
                      onClick={applyPromo}
                      disabled={!promoInput.trim() || promoLoading}
                      className="px-4 py-2.5 rounded-xl bg-dark-700 hover:bg-dark-600 disabled:opacity-40 text-sm font-medium transition-colors"
                    >
                      {promoLoading ? <Loader2 size={14} className="animate-spin" /> : 'Aplicar'}
                    </button>
                  </div>
                )}
                {promo && !promo.valid && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle size={12} /> {promo.error}
                  </p>
                )}
              </div>

              {/* Price summary */}
              {promo?.valid && (
                <div className="mt-3 bg-dark-800 border border-dark-600 rounded-xl p-3 text-sm space-y-1">
                  <div className="flex justify-between text-dark-400">
                    <span>Valor original</span>
                    <span className="line-through">{formatCurrency(promo.basePrice ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-green-400">
                    <span>Desconto ({promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}%` : 'fixo'})</span>
                    <span>- {formatCurrency(promo.discountAmount ?? 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-white border-t border-dark-600 pt-1">
                    <span>Total</span>
                    <span className="text-gradient-gold">{formatCurrency(promo.finalPrice ?? 0)}</span>
                  </div>
                </div>
              )}

              {pixError && (
                <div className="mt-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
                  <AlertCircle size={16} /> {pixError}
                </div>
              )}

              <button onClick={handleGeneratePix} disabled={loading}
                className="w-full mt-4 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-dark-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 gold-glow transition-colors">
                {loading
                  ? <div className="w-5 h-5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                  : <><QrCode size={18} />Pagar com PIX — {formatCurrency(finalPrice)}</>
                }
              </button>
              <p className="text-xs text-dark-400 text-center mt-2">
                Pagamento 100% seguro via PIX • Acesso imediato após confirmação
              </p>
            </div>

            <div className="glass rounded-2xl p-6 border border-dark-600">
              <h3 className="font-bold text-sm mb-3">O que está incluído</h3>
              <div className="space-y-2.5">
                {features.map(f => (
                  <div key={f} className="flex items-center gap-2.5">
                    <CheckCircle size={14} className="text-gold-400 shrink-0" />
                    <span className="text-sm text-dark-100">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* STEP: PIX QR Code */}
        {step === 'pix' && pixData && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-lg font-bold mb-1">Pague com PIX</h2>
              <p className="text-sm text-dark-300">
                Plano {PLAN_NAMES[selected]} ·{' '}
                {pixData.discount && pixData.discount > 0 ? (
                  <>
                    <span className="line-through text-dark-500">{formatCurrency(pixData.basePrice ?? 0)}</span>{' '}
                    <span className="text-gold-400 font-bold">{formatCurrency(pixData.amount)}</span>
                  </>
                ) : (
                  <span className="text-gold-400 font-bold">{formatCurrency(pixData.amount)}</span>
                )}
              </p>
              {pixData.discount && pixData.discount > 0 && (
                <p className="text-xs text-green-400 mt-1">
                  Cupom aplicado — economia de {formatCurrency(pixData.discount)}
                </p>
              )}
            </div>

            <div className="flex flex-col items-center gap-4">
              {pixData.qrCodeImage ? (
                <div className="p-4 bg-white rounded-2xl shadow-lg">
                  <img src={pixData.qrCodeImage} alt="QR Code PIX" className="w-56 h-56" />
                </div>
              ) : (
                <div className="p-8 bg-dark-700 rounded-2xl border border-dark-500 flex items-center justify-center">
                  <QrCode size={80} className="text-dark-400" />
                </div>
              )}
              {polling && (
                <div className="flex items-center gap-2 text-sm text-gold-400">
                  <RefreshCw size={14} className="animate-spin" />
                  Aguardando confirmação do pagamento...
                </div>
              )}
            </div>

            {pixData.qrCodeText && (
              <div className="space-y-2">
                <p className="text-xs text-dark-400 text-center">Ou copie o código Pix Copia e Cola:</p>
                <div className="flex items-center gap-2 bg-dark-700 border border-dark-500 rounded-xl p-3">
                  <p className="flex-1 text-xs text-dark-200 font-mono truncate">{pixData.qrCodeText}</p>
                  <button onClick={copyCode}
                    className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${copied ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-dark-600 text-dark-200 hover:bg-dark-500'}`}>
                    {copied ? <><Check size={12} />Copiado!</> : <><Copy size={12} />Copiar</>}
                  </button>
                </div>
              </div>
            )}

            {pixData.expiresAt && (
              <p className="text-xs text-dark-400 text-center">
                QR Code expira em: {new Date(pixData.expiresAt).toLocaleTimeString('pt-BR')}
              </p>
            )}

            <div className="glass rounded-xl p-4 border border-dark-600 text-sm text-dark-300 space-y-1.5">
              <p>1. Abra o app do seu banco</p>
              <p>2. Escolha pagar via QR Code ou Pix Copia e Cola</p>
              <p>3. Confirme o pagamento — seu acesso é liberado em segundos</p>
            </div>
          </div>
        )}

        {/* STEP: Done */}
        {step === 'done' && (
          <div className="text-center py-12 space-y-4">
            <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
              <CheckCircle size={40} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gradient-gold">Pagamento confirmado!</h2>
            <p className="text-dark-300">Seu acesso ao Clube Elite está ativo.<br />Aproveite todos os benefícios.</p>
            <a href="/discover"
              className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-dark-900 font-bold px-8 py-3 rounded-xl transition-colors mt-2">
              <Crown size={18} />
              Explorar o Clube
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
