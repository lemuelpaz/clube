'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) setError('Link inválido ou expirado.')
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }

    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Erro ao redefinir senha.')
    } else {
      setDone(true)
      setTimeout(() => router.push('/login'), 3000)
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
          <h1 className="text-2xl font-bold">Nova senha</h1>
          <p className="text-dark-200 text-sm mt-1">
            {done ? 'Senha redefinida com sucesso' : 'Crie uma nova senha para sua conta'}
          </p>
        </div>

        {done ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <p className="text-sm text-dark-200">
              Sua senha foi redefinida com sucesso. Redirecionando para o login...
            </p>
            <Link href="/login" className="block w-full py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-dark-50 font-bold text-sm text-center transition-colors">
              Ir para o login
            </Link>
          </div>
        ) : !token ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            <p className="text-sm text-dark-300">Link inválido ou expirado. Solicite um novo link de redefinição.</p>
            <Link href="/forgot-password" className="block w-full py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-dark-50 font-bold text-sm text-center transition-colors">
              Solicitar novo link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-100 mb-1.5">Nova senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full bg-dark-700 border border-dark-400 rounded-xl px-4 py-3 pr-12 text-sm text-dark-50 placeholder-dark-300 focus:outline-none focus:border-gold-500/50 transition-colors"
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-300 hover:text-gold-400 transition-colors">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-100 mb-1.5">Confirmar senha</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repita a senha"
                required
                className="w-full bg-dark-700 border border-dark-400 rounded-xl px-4 py-3 text-sm text-dark-50 placeholder-dark-300 focus:outline-none focus:border-gold-500/50 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center gap-2">
                <AlertCircle size={15} />
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
                'Redefinir senha'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md">
        <div className="glass rounded-2xl p-8 border border-gold-500/10 flex items-center justify-center min-h-64">
          <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
