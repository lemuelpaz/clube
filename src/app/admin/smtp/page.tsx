'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, Save, CheckCircle, AlertCircle, Eye, EyeOff, Wifi } from 'lucide-react'

export default function AdminSmtpPage() {
  const [form, setForm] = useState({
    host: 'smtp.gmail.com',
    port: '587',
    secure: false,
    user: '',
    password: '',
    fromEmail: '',
    fromName: 'Clube Elite',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testOk, setTestOk] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [hasExisting, setHasExisting] = useState(false)

  useEffect(() => {
    fetch('/api/admin/smtp').then(r => r.json()).then(d => {
      if (d.config) {
        setHasExisting(true)
        setForm(f => ({
          ...f,
          host: d.config.host,
          port: String(d.config.port),
          secure: d.config.secure,
          user: d.config.user,
          fromEmail: d.config.fromEmail,
          fromName: d.config.fromName,
        }))
      }
      setLoading(false)
    })
  }, [])

  function payload() {
    return { ...form, port: Number(form.port) }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setTestOk(false)
    const res = await fetch('/api/admin/smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload()),
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

  async function handleTest() {
    setTesting(true)
    setError('')
    setTestOk(false)
    const res = await fetch('/api/admin/smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload(), test: true }),
    })
    const data = await res.json()
    if (data.success) {
      setTestOk(true)
      setTimeout(() => setTestOk(false), 4000)
    } else {
      setError(data.error ?? 'Falha na conexão.')
    }
    setTesting(false)
  }

  const f = (k: keyof typeof form, v: string | boolean) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="min-h-screen pb-8">
      <div className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-lg border-b border-dark-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-dark-300 hover:text-dark-50 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">Configuração de E-mail (SMTP)</h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-6 space-y-6">
        {/* Provider card */}
        <div className="glass rounded-2xl p-5 border border-gold-500/15 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-dark-700 flex items-center justify-center border border-dark-600 shrink-0">
            <Mail size={22} className="text-gold-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold">Gmail via SMTP</p>
            <p className="text-xs text-dark-400">Envio de e-mails transacionais (recuperação de senha, notificações)</p>
            {hasExisting && <span className="text-xs text-green-400 font-medium">✓ Configurado</span>}
          </div>
        </div>

        {/* Gmail tip */}
        <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl px-4 py-3 text-xs text-blue-300 space-y-1">
          <p className="font-semibold text-blue-200">Como configurar com Gmail</p>
          <p>1. Ative a verificação em duas etapas na sua conta Google</p>
          <p>2. Acesse <strong>Conta Google → Segurança → Senhas de app</strong></p>
          <p>3. Crie uma senha de app para "Outro" e use-a no campo Senha abaixo</p>
          <p>4. Use sua conta Gmail completa como Usuário e Remetente</p>
        </div>

        <div className="glass rounded-2xl p-6 border border-dark-600 space-y-5">
          <h2 className="font-bold text-sm">Configurações do servidor</h2>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-dark-400 mb-1.5 block">Host SMTP</label>
              <input
                value={form.host}
                onChange={e => f('host', e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full bg-dark-800 border border-dark-500 rounded-xl px-4 py-2.5 text-sm text-dark-50 placeholder-dark-500 focus:outline-none focus:border-gold-500/50 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-dark-400 mb-1.5 block">Porta</label>
              <input
                value={form.port}
                onChange={e => f('port', e.target.value)}
                placeholder="587"
                className="w-full bg-dark-800 border border-dark-500 rounded-xl px-4 py-2.5 text-sm text-dark-50 placeholder-dark-500 focus:outline-none focus:border-gold-500/50 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2.5 border border-dark-600/50 rounded-xl px-4">
            <div>
              <p className="text-sm font-medium">SSL/TLS</p>
              <p className="text-xs text-dark-400">Porta 465 usa SSL. Porta 587 usa STARTTLS (desativado)</p>
            </div>
            <button
              onClick={() => f('secure', !form.secure)}
              className={`relative w-11 h-6 rounded-full transition-all ${form.secure ? 'bg-gold-500' : 'bg-dark-600'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.secure ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          <div>
            <label className="text-xs text-dark-400 mb-1.5 block">Usuário (conta Gmail)</label>
            <input
              value={form.user}
              onChange={e => f('user', e.target.value)}
              placeholder="seuemail@gmail.com"
              className="w-full bg-dark-800 border border-dark-500 rounded-xl px-4 py-2.5 text-sm text-dark-50 placeholder-dark-500 focus:outline-none focus:border-gold-500/50"
            />
          </div>

          <div>
            <label className="text-xs text-dark-400 mb-1.5 block">Senha de app</label>
            <div className="relative">
              <input
                value={form.password}
                onChange={e => f('password', e.target.value)}
                type={showPass ? 'text' : 'password'}
                placeholder={hasExisting ? '••••••••••••••••' : 'Senha de app gerada no Google'}
                className="w-full bg-dark-800 border border-dark-500 rounded-xl px-4 py-2.5 pr-12 text-sm text-dark-50 placeholder-dark-500 focus:outline-none focus:border-gold-500/50 font-mono"
              />
              <button onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-50 transition-colors">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {hasExisting && !form.password && (
              <p className="text-xs text-dark-500 mt-1">Deixe em branco para manter a senha atual</p>
            )}
          </div>

          <div className="border-t border-dark-600/50 pt-4 space-y-4">
            <h3 className="text-xs text-dark-400 font-medium uppercase tracking-wider">Remetente</h3>
            <div>
              <label className="text-xs text-dark-400 mb-1.5 block">E-mail remetente</label>
              <input
                value={form.fromEmail}
                onChange={e => f('fromEmail', e.target.value)}
                placeholder="noreply@seudominio.com ou conta@gmail.com"
                className="w-full bg-dark-800 border border-dark-500 rounded-xl px-4 py-2.5 text-sm text-dark-50 placeholder-dark-500 focus:outline-none focus:border-gold-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-dark-400 mb-1.5 block">Nome remetente</label>
              <input
                value={form.fromName}
                onChange={e => f('fromName', e.target.value)}
                placeholder="Clube Elite"
                className="w-full bg-dark-800 border border-dark-500 rounded-xl px-4 py-2.5 text-sm text-dark-50 placeholder-dark-500 focus:outline-none focus:border-gold-500/50"
              />
            </div>
          </div>

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

          {testOk && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-sm text-green-400">
              <Wifi size={15} />
              Conexão testada com sucesso!
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handleTest} disabled={testing || loading}
              className="flex-1 py-3 rounded-xl font-bold border border-dark-500 hover:border-dark-400 text-dark-200 hover:text-dark-50 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors text-sm">
              {testing
                ? <div className="w-4 h-4 border-2 border-dark-400/30 border-t-dark-400 rounded-full animate-spin" />
                : <><Wifi size={15} />Testar conexão</>
              }
            </button>
            <button onClick={handleSave} disabled={saving || loading}
              className="flex-1 py-3 rounded-xl font-bold bg-gold-500 hover:bg-gold-400 text-dark-50 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors text-sm">
              {saving
                ? <div className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                : <><Save size={15} />Salvar</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
