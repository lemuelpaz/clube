'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Key, Save, CheckCircle, AlertCircle, Eye, EyeOff, ExternalLink } from 'lucide-react'

export default function PaymentConfigPage() {
  const [form, setForm] = useState({ clientId: '', clientSecret: '', sandbox: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [hasExisting, setHasExisting] = useState(false)

  useEffect(() => {
    fetch('/api/admin/payment-config').then(r => r.json()).then(d => {
      if (d.config) {
        setHasExisting(true)
        setForm(f => ({ ...f, clientId: d.config.clientId, sandbox: d.config.sandbox }))
      }
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    setError('')
    if (!form.clientId || !form.clientSecret) {
      setError('Client ID e Client Secret são obrigatórios.')
      setSaving(false)
      return
    }
    const res = await fetch('/api/admin/payment-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.success) {
      setSaved(true)
      setHasExisting(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError(data.error ?? 'Erro ao salvar.')
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-lg border-b border-dark-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-dark-300 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">Gateway de Pagamento</h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-6 space-y-6">
        {/* Provider badge */}
        <div className="glass rounded-2xl p-5 border border-gold-500/15 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-dark-700 flex items-center justify-center border border-dark-600 shrink-0">
            <Key size={22} className="text-gold-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold">PixUp</p>
            <p className="text-xs text-dark-400">Gateway de pagamento via PIX para assinaturas</p>
            {hasExisting && <span className="text-xs text-green-400 font-medium">✓ Configurado</span>}
          </div>
          <a href="https://pixup.readme.io/reference/come%C3%A7ando" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300 transition-colors shrink-0">
            Docs <ExternalLink size={12} />
          </a>
        </div>

        <div className="glass rounded-2xl p-6 border border-dark-600 space-y-5">
          <h2 className="font-bold text-sm">Credenciais da API</h2>

          <div>
            <label className="text-xs text-dark-400 mb-1.5 block">Client ID</label>
            <input
              value={form.clientId}
              onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
              placeholder="Seu Client ID da PixUp"
              className="w-full bg-dark-800 border border-dark-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-gold-500/50 font-mono"
            />
          </div>

          <div>
            <label className="text-xs text-dark-400 mb-1.5 block">Client Secret</label>
            <div className="relative">
              <input
                value={form.clientSecret}
                onChange={e => setForm(f => ({ ...f, clientSecret: e.target.value }))}
                type={showSecret ? 'text' : 'password'}
                placeholder={hasExisting ? '••••••••••••••••' : 'Seu Client Secret da PixUp'}
                className="w-full bg-dark-800 border border-dark-500 rounded-xl px-4 py-2.5 pr-12 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-gold-500/50 font-mono"
              />
              <button onClick={() => setShowSecret(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors">
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {hasExisting && !form.clientSecret && (
              <p className="text-xs text-dark-500 mt-1">Deixe em branco para manter o secret atual</p>
            )}
          </div>

          {/* Sandbox toggle */}
          <div className="flex items-center justify-between py-3 border-t border-dark-600/50">
            <div>
              <p className="text-sm font-medium">Modo Sandbox</p>
              <p className="text-xs text-dark-400">Ative para testes sem cobranças reais</p>
            </div>
            <button
              onClick={() => setForm(f => ({ ...f, sandbox: !f.sandbox }))}
              className={`relative w-11 h-6 rounded-full transition-all ${form.sandbox ? 'bg-gold-500' : 'bg-dark-600'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.sandbox ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          {form.sandbox && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-xs text-yellow-400">
              ⚠️ Modo sandbox ativado — cobranças não serão processadas. Use apenas para testes.
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-sm text-green-400">
              <CheckCircle size={15} />
              Configuração salva com sucesso!
            </div>
          )}

          <button onClick={handleSave} disabled={saving || loading}
            className="w-full py-3 rounded-xl font-bold bg-gold-500 hover:bg-gold-400 text-dark-900 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            {saving
              ? <div className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
              : <><Save size={16} />Salvar configuração</>
            }
          </button>
        </div>

        <div className="glass rounded-xl p-5 border border-dark-600 text-sm text-dark-300 space-y-2">
          <p className="font-medium text-white text-xs uppercase tracking-wider mb-3">Como obter as credenciais</p>
          <p>1. Acesse o <a href="https://app.pixup.com.br" target="_blank" className="text-gold-400">Dashboard PixUp</a></p>
          <p>2. Vá em <strong className="text-white">API → Credenciais</strong></p>
          <p>3. Copie o <strong className="text-white">Client ID</strong> e o <strong className="text-white">Client Secret</strong></p>
          <p>4. Para sandbox, solicite ao suporte PixUp via gerente de conta</p>
        </div>
      </div>
    </div>
  )
}
