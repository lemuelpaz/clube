'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Erro ao enviar e-mail.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-md">
      <div className="glass rounded-2xl p-8 border border-gold-500/10">
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 w-40">
            <Image src="/elite1.png" alt="Logo" width={160} height={160} className="w-full h-auto" priority />
          </div>
          <h1 className="text-2xl font-bold">Esqueci minha senha</h1>
          <p className="text-dark-200 text-sm mt-1">
            {sent ? 'Verifique seu e-mail' : 'Informe seu e-mail para receber o link de redefinição'}
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm text-dark-200">
                Se existir uma conta com o e-mail <strong className="text-dark-50">{email}</strong>, você receberá um link para redefinir sua senha em instantes.
              </p>
              <p className="text-xs text-dark-400 mt-2">Verifique também a pasta de spam.</p>
            </div>
            <Link
              href="/login"
              className="block w-full py-3 rounded-xl border border-dark-500 text-sm font-medium text-dark-200 hover:text-dark-50 hover:border-dark-400 transition-colors text-center"
            >
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-100 mb-1.5">E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full bg-dark-700 border border-dark-400 rounded-xl pl-10 pr-4 py-3 text-sm text-dark-50 placeholder-dark-300 focus:outline-none focus:border-gold-500/50 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-dark-50 font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
              ) : (
                'Enviar link de redefinição'
              )}
            </button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-dark-300 hover:text-dark-50 transition-colors"
            >
              <ArrowLeft size={14} />
              Voltar para o login
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
