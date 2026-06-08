'use client'

import { useState, useEffect } from 'react'
import { CreditCard, TrendingUp, Calendar, Crown } from 'lucide-react'
import { formatCurrency, PLAN_NAMES } from '@/lib/utils'

export default function FinancialPage() {
  const [stats, setStats] = useState<any>(null)
  const [subs, setSubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then(r => r.json()),
      fetch('/api/admin/users').then(r => r.json()),
    ]).then(([statsData, usersData]) => {
      if (statsData.stats) setStats(statsData.stats)
      setLoading(false)
    })
  }, [])

  const planBreakdown = [
    { plan: 'MONTHLY', label: 'Mensal', price: 149.90 },
    { plan: 'QUARTERLY', label: 'Trimestral', price: 399.90 },
    { plan: 'SEMIANNUAL', label: 'Semestral', price: 699.90 },
    { plan: 'ANNUAL', label: 'Anual', price: 1199.90 },
  ]

  return (
    <div className="min-h-screen pb-8">
      <div className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-lg border-b border-dark-700 px-6 py-4">
        <h1 className="text-xl font-bold">Financeiro</h1>
      </div>

      <div className="p-6 space-y-6">
        {/* Revenue cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: 'Receita Mensal Estimada',
              value: loading ? '...' : formatCurrency(stats?.monthlyRevenue ?? 0),
              icon: TrendingUp, sub: 'Baseado nas assinaturas ativas',
            },
            {
              label: 'Assinaturas Ativas',
              value: loading ? '...' : stats?.activeSubscriptions ?? 0,
              icon: Crown, sub: 'Total de planos ativos',
            },
            {
              label: 'Ticket Médio',
              value: loading ? '...' : stats?.activeSubscriptions > 0 ? formatCurrency((stats?.monthlyRevenue ?? 0) / stats.activeSubscriptions) : '—',
              icon: CreditCard, sub: 'Por assinante/mês',
            },
          ].map(({ label, value, icon: Icon, sub }) => (
            <div key={label} className="p-5 rounded-2xl bg-dark-800 border border-dark-600">
              <Icon size={20} className="text-gold-400 mb-3" />
              <p className="text-2xl font-black mb-1">{value}</p>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-dark-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Plans breakdown */}
        <div className="rounded-2xl bg-dark-800 border border-dark-600 p-6">
          <h2 className="font-bold mb-5">Planos Disponíveis</h2>
          <div className="space-y-3">
            {planBreakdown.map(({ plan, label, price }) => (
              <div key={plan} className="flex items-center justify-between p-4 rounded-xl bg-dark-700 border border-dark-600">
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-gold-400" />
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-dark-400">Plano {plan}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gradient-gold">{formatCurrency(price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment methods info */}
        <div className="rounded-2xl bg-dark-800 border border-dark-600 p-6">
          <h2 className="font-bold mb-4">Integrações de Pagamento</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Stripe', 'Mercado Pago', 'Asaas', 'PagSeguro'].map(pm => (
              <div key={pm} className="p-3 rounded-xl bg-dark-700 border border-dark-600 text-center">
                <CreditCard size={20} className="text-gold-400 mx-auto mb-2" />
                <p className="text-sm font-medium">{pm}</p>
                <p className="text-xs text-dark-400 mt-0.5">Configurar</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
