'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn, getSession } from 'next-auth/react'
import Image from 'next/image'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email, password, redirect: false,
    })

    if (result?.error) {
      setError('Email ou senha incorretos')
      setLoading(false)
      return
    }

    // Redirect based on role
    const session = await getSession()
    const role = (session?.user as any)?.role

    if (role === 'ADMIN') router.push('/admin')
    else if (role === 'FEMALE') router.push('/verification')
    else router.push('/discover')
  }

  return (
    <div className="w-full max-w-md">
      <div className="glass rounded-2xl p-8 border border-gold-500/10">
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 w-40">
            <Image src="/elite1.png" alt="Logo" width={160} height={160} className="w-full h-auto" priority />
          </div>
          <h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
          <p className="text-dark-200 text-sm mt-1">Entre na sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-100 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full bg-dark-700 border border-dark-400 rounded-xl px-4 py-3 text-sm text-dark-50 placeholder-dark-300 focus:outline-none focus:border-gold-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-100 mb-1.5">Senha</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-dark-700 border border-dark-400 rounded-xl px-4 py-3 pr-12 text-sm text-dark-50 placeholder-dark-300 focus:outline-none focus:border-gold-500/50 transition-colors"
              />
              <button type="button" onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-300 hover:text-gold-400 transition-colors">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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
              <><LogIn size={18} />Entrar</>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/forgot-password" className="text-sm text-dark-400 hover:text-gold-400 transition-colors">
            Esqueci minha senha
          </Link>
        </div>

        <div className="mt-4 text-center text-sm text-dark-300">
          Não tem conta?{' '}
          <Link href="/register" className="text-gold-400 hover:text-gold-300 font-medium transition-colors">
            Criar conta
          </Link>
        </div>

      </div>
    </div>
  )
}

