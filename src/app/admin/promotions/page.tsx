'use client'

import { useState, useEffect } from 'react'
import { Plus, Tag, Trash2, ToggleLeft, ToggleRight, X, Check, AlertCircle, Percent, DollarSign, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Promotion {
  id: string
  code: string
  description?: string
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  maxUses?: number
  uses: number
  validFrom?: string
  validUntil?: string
  active: boolean
  appliesTo: string
  createdAt: string
}

const PLAN_LABELS: Record<string, string> = {
  ALL: 'Todos os Planos',
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
}

const emptyForm = {
  code: '',
  description: '',
  discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
  discountValue: '',
  maxUses: '',
  validFrom: '',
  validUntil: '',
  appliesTo: 'ALL',
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/admin/promotions')
    const d = await res.json()
    if (d.promotions) setPromotions(d.promotions)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openModal() {
    setForm(emptyForm)
    setFormError('')
    setShowModal(true)
  }

  async function handleCreate() {
    if (!form.code.trim() || !form.discountValue) {
      setFormError('Código e valor do desconto são obrigatórios')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          description: form.description || undefined,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          maxUses: form.maxUses ? Number(form.maxUses) : undefined,
          validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : undefined,
          validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : undefined,
          appliesTo: form.appliesTo,
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        setFormError(d.error ?? 'Erro ao criar')
      } else {
        setShowModal(false)
        load()
      }
    } catch {
      setFormError('Erro de conexão')
    }
    setSaving(false)
  }

  async function handleToggle(promo: Promotion) {
    await fetch(`/api/admin/promotions/${promo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !promo.active }),
    })
    setPromotions(prev => prev.map(p => p.id === promo.id ? { ...p, active: !p.active } : p))
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' })
    setPromotions(prev => prev.filter(p => p.id !== id))
    setDeleteConfirm(null)
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-lg border-b border-dark-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Promoções</h1>
            <p className="text-sm text-dark-400 mt-0.5">Cupons de desconto para assinaturas</p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-dark-900 font-bold text-sm transition-colors gold-glow"
          >
            <Plus size={16} /> Nova Promoção
          </button>
        </div>
      </div>

      <div className="p-6 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-dark-800 animate-pulse" />)
        ) : promotions.length === 0 ? (
          <div className="text-center py-16">
            <Tag size={40} className="text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400">Nenhuma promoção criada ainda</p>
            <button onClick={openModal} className="mt-4 px-5 py-2 rounded-xl bg-dark-700 hover:bg-dark-600 text-sm transition-colors">
              Criar primeira promoção
            </button>
          </div>
        ) : (
          promotions.map(promo => (
            <div key={promo.id}
              className={`p-4 rounded-2xl bg-dark-800 border transition-all ${promo.active ? 'border-dark-600' : 'border-dark-700 opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${promo.active ? 'bg-gold-500/15' : 'bg-dark-700'}`}>
                    <Tag size={16} className={promo.active ? 'text-gold-400' : 'text-dark-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm tracking-wider">{promo.code}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${promo.active ? 'bg-green-500/15 text-green-400' : 'bg-dark-700 text-dark-400'}`}>
                        {promo.active ? 'Ativo' : 'Inativo'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-400">
                        {promo.discountType === 'PERCENTAGE'
                          ? `${promo.discountValue}% off`
                          : `${formatCurrency(promo.discountValue)} off`}
                      </span>
                      <span className="text-xs text-dark-500">{PLAN_LABELS[promo.appliesTo] ?? promo.appliesTo}</span>
                    </div>
                    {promo.description && (
                      <p className="text-xs text-dark-400 mt-0.5 truncate">{promo.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-dark-500">
                      <span>{promo.uses}{promo.maxUses !== undefined ? `/${promo.maxUses}` : ''} usos</span>
                      {promo.validUntil && (
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          até {new Date(promo.validUntil).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggle(promo)}
                    className="p-2 rounded-xl hover:bg-dark-700 transition-colors"
                    title={promo.active ? 'Desativar' : 'Ativar'}
                  >
                    {promo.active
                      ? <ToggleRight size={20} className="text-gold-400" />
                      : <ToggleLeft size={20} className="text-dark-500" />}
                  </button>
                  {deleteConfirm === promo.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(promo.id)}
                        className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 transition-colors">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setDeleteConfirm(null)}
                        className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(promo.id)}
                      className="p-2 rounded-xl hover:bg-red-500/10 text-dark-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
          <div className="w-full max-w-md bg-dark-800 rounded-3xl border border-dark-600 shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-dark-700">
              <h2 className="text-lg font-bold">Nova Promoção</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-dark-700 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
                  <AlertCircle size={15} /> {formError}
                </div>
              )}

              {/* Code */}
              <div>
                <label className="text-xs text-dark-400 font-medium mb-1.5 block">Código do Cupom *</label>
                <input
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="EX: PROMO20"
                  className="w-full bg-dark-700 border border-dark-500 focus:border-gold-500 rounded-xl px-4 py-2.5 font-mono uppercase text-sm outline-none transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-dark-400 font-medium mb-1.5 block">Descrição (opcional)</label>
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Ex: Promoção de lançamento"
                  className="w-full bg-dark-700 border border-dark-500 focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
                />
              </div>

              {/* Discount type */}
              <div>
                <label className="text-xs text-dark-400 font-medium mb-1.5 block">Tipo de Desconto *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['PERCENTAGE', 'FIXED'] as const).map(type => (
                    <button key={type} onClick={() => setForm(f => ({ ...f, discountType: type }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-all ${form.discountType === type ? 'border-gold-500 bg-gold-500/10 text-white' : 'border-dark-600 bg-dark-700 text-dark-300'}`}>
                      {type === 'PERCENTAGE' ? <Percent size={14} /> : <DollarSign size={14} />}
                      {type === 'PERCENTAGE' ? 'Percentual' : 'Valor Fixo'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount value */}
              <div>
                <label className="text-xs text-dark-400 font-medium mb-1.5 block">
                  {form.discountType === 'PERCENTAGE' ? 'Percentual (%) *' : 'Valor em R$ *'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={form.discountType === 'PERCENTAGE' ? 100 : undefined}
                    step="0.01"
                    value={form.discountValue}
                    onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                    placeholder={form.discountType === 'PERCENTAGE' ? '20' : '50.00'}
                    className="w-full bg-dark-700 border border-dark-500 focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 text-sm">
                    {form.discountType === 'PERCENTAGE' ? '%' : 'R$'}
                  </span>
                </div>
              </div>

              {/* Applies to */}
              <div>
                <label className="text-xs text-dark-400 font-medium mb-1.5 block">Aplica Para</label>
                <select
                  value={form.appliesTo}
                  onChange={e => setForm(f => ({ ...f, appliesTo: e.target.value }))}
                  className="w-full bg-dark-700 border border-dark-500 focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
                >
                  {Object.entries(PLAN_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Max uses */}
              <div>
                <label className="text-xs text-dark-400 font-medium mb-1.5 block">Máximo de Usos (deixe vazio para ilimitado)</label>
                <input
                  type="number"
                  min="1"
                  value={form.maxUses}
                  onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                  placeholder="Ex: 100"
                  className="w-full bg-dark-700 border border-dark-500 focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-dark-400 font-medium mb-1.5 block">Início (opcional)</label>
                  <input
                    type="datetime-local"
                    value={form.validFrom}
                    onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))}
                    className="w-full bg-dark-700 border border-dark-500 focus:border-gold-500 rounded-xl px-3 py-2.5 text-xs outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-400 font-medium mb-1.5 block">Expiração (opcional)</label>
                  <input
                    type="datetime-local"
                    value={form.validUntil}
                    onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                    className="w-full bg-dark-700 border border-dark-500 focus:border-gold-500 rounded-xl px-3 py-2.5 text-xs outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 pt-4 border-t border-dark-700 flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl bg-dark-700 hover:bg-dark-600 text-sm font-medium transition-colors">
                Cancelar
              </button>
              <button onClick={handleCreate} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-dark-900 font-bold text-sm transition-colors gold-glow">
                {saving
                  ? <div className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin mx-auto" />
                  : 'Criar Promoção'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
