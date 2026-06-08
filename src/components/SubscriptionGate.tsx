'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Crown, CheckCircle, Lock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Props { children: React.ReactNode }

export default function SubscriptionGate({ children }: Props) {
  const { data: session } = useSession()
  const user = session?.user as any
  const [hasSub, setHasSub] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user?.id || user.role !== 'MALE') { setHasSub(true); return }
    fetch('/api/subscriptions')
      .then(r => r.json())
      .then(d => setHasSub(!!(d.active && d.active.status === 'ACTIVE')))
      .catch(() => setHasSub(false))
  }, [user?.id, user?.role])

  // Non-male users always pass
  if (!user || user.role !== 'MALE') return <>{children}</>

  // Loading
  if (hasSub === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (hasSub) return <>{children}</>

  // Paywall
  return (
    <div className="relative h-screen overflow-hidden flex flex-col items-center justify-center">
      {/* Blurred bg hint */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-800 via-dark-900 to-dark-900 opacity-95 z-0" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm mx-auto">
        <div className="w-20 h-20 rounded-full bg-gold-500/15 border border-gold-500/30 flex items-center justify-center mb-6">
          <Lock size={32} className="text-gold-400" />
        </div>

        <Crown size={20} className="text-gold-400 mb-2" />
        <h2 className="text-2xl font-black mb-2 text-gradient-gold">Clube Elite</h2>
        <p className="text-dark-200 mb-6 text-sm leading-relaxed">
          Assine para ter acesso ilimitado a perfis verificados, matches e mensagens.
        </p>

        <div className="w-full space-y-2.5 mb-6">
          {[
            'Perfis verificados e exclusivos',
            'Matches e mensagens ilimitadas',
            'Solicitar fotos exclusivas',
            'Suporte prioritário',
          ].map(f => (
            <div key={f} className="flex items-center gap-2.5 text-left">
              <CheckCircle size={15} className="text-gold-400 shrink-0" />
              <span className="text-sm text-dark-100">{f}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-dark-400 mb-3">A partir de</p>
        <p className="text-3xl font-black text-gradient-gold mb-5">{formatCurrency(149.90)}<span className="text-base font-normal text-dark-300">/mês</span></p>

        <Link href="/subscription"
          className="w-full bg-gold-500 hover:bg-gold-400 text-dark-50 font-black py-4 rounded-xl flex items-center justify-center gap-2 gold-glow transition-colors text-base">
          <Crown size={18} />
          Assinar agora · Pague com PIX
        </Link>
        <p className="text-xs text-dark-500 mt-3">Pagamento via PIX · Acesso imediato</p>
      </div>
    </div>
  )
}

