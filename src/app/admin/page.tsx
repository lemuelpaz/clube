'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Shield, Crown, Heart, MessageCircle, TrendingUp, ChevronRight, AlertCircle, ArrowDownToLine, Key, Tag, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Stats {
  totalUsers: number
  maleUsers: number
  femaleUsers: number
  pendingVerifications: number
  activeSubscriptions: number
  monthlyRevenue: number
  totalMatches: number
  totalMessages: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => {
      if (d.stats) setStats(d.stats)
      setLoading(false)
    })
  }, [])

  const cards = stats ? [
    { label: 'Usuários Totais', value: stats.totalUsers, icon: Users, sub: `${stats.maleUsers} homens · ${stats.femaleUsers} mulheres`, color: 'blue' },
    { label: 'Verificações Pendentes', value: stats.pendingVerifications, icon: Shield, sub: 'Aguardando aprovação', color: 'yellow', alert: stats.pendingVerifications > 0 },
    { label: 'Assinaturas Ativas', value: stats.activeSubscriptions, icon: Crown, sub: 'Assinantes ativos', color: 'gold' },
    { label: 'Receita Mensal Est.', value: formatCurrency(stats.monthlyRevenue), icon: TrendingUp, sub: 'Estimativa atual', color: 'green' },
    { label: 'Total de Matches', value: stats.totalMatches, icon: Heart, sub: 'Conexões realizadas', color: 'pink' },
    { label: 'Mensagens Enviadas', value: stats.totalMessages, icon: MessageCircle, sub: 'Total geral', color: 'purple' },
  ] : []

  return (
    <div className="min-h-screen pb-8">
      <div className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-lg border-b border-dark-700 px-6 py-4">
        <h1 className="text-xl font-bold">Dashboard</h1>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-dark-800 animate-pulse" />
            ))
          ) : (
            cards.map(({ label, value, icon: Icon, sub, alert }) => (
              <div key={label} className={`relative p-5 rounded-2xl bg-dark-800 border ${alert ? 'border-yellow-500/30' : 'border-dark-600'} transition-all`}>
                {alert && (
                  <div className="absolute top-3 right-3">
                    <AlertCircle size={16} className="text-yellow-400" />
                  </div>
                )}
                <Icon size={20} className="text-gold-400 mb-3" />
                <p className="text-2xl font-black mb-1">{value}</p>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-dark-400 mt-0.5">{sub}</p>
              </div>
            ))
          )}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-base font-bold mb-4 text-dark-200">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { href: '/admin/verifications', icon: Shield, title: 'Aprovar Verificações', desc: 'Revisar documentos pendentes', urgent: stats?.pendingVerifications ?? 0 > 0 },
              { href: '/admin/withdrawals', icon: ArrowDownToLine, title: 'Saques Pendentes', desc: 'Aprovar ou rejeitar solicitações de saque' },
              { href: '/admin/plans', icon: DollarSign, title: 'Preços dos Planos', desc: 'Ajustar valores das assinaturas' },
              { href: '/admin/promotions', icon: Tag, title: 'Promoções', desc: 'Criar e gerenciar cupons de desconto' },
              { href: '/admin/payment-config', icon: Key, title: 'Gateway PIX (PixUp)', desc: 'Configurar chaves de API do gateway' },
              { href: '/admin/users', icon: Users, title: 'Gerenciar Usuários', desc: 'Suspender, banir ou reativar contas' },
              { href: '/admin/financial', icon: Crown, title: 'Relatório Financeiro', desc: 'Assinaturas e receita' },
            ].map(({ href, icon: Icon, title, desc, urgent }) => (
              <Link key={href} href={href}
                className="flex items-center gap-4 p-5 rounded-2xl bg-dark-800 border border-dark-600 hover:border-gold-500/30 transition-all card-hover">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${urgent ? 'bg-yellow-500/20' : 'bg-gold-500/10'}`}>
                  <Icon size={18} className={urgent ? 'text-yellow-400' : 'text-gold-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{title}</p>
                  <p className="text-xs text-dark-400">{desc}</p>
                </div>
                <ChevronRight size={16} className="text-dark-500 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
