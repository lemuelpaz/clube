'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Crown, LayoutDashboard, Users, Shield, CreditCard, LogOut, AlertTriangle, ArrowDownToLine, Key, Tag, DollarSign } from 'lucide-react'

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/users', icon: Users, label: 'Usuários' },
  { href: '/admin/verifications', icon: Shield, label: 'Verificações' },
  { href: '/admin/withdrawals', icon: ArrowDownToLine, label: 'Saques' },
  { href: '/admin/plans', icon: DollarSign, label: 'Preços dos Planos' },
  { href: '/admin/promotions', icon: Tag, label: 'Promoções' },
  { href: '/admin/financial', icon: CreditCard, label: 'Financeiro' },
  { href: '/admin/payment-config', icon: Key, label: 'Gateway PIX' },
  { href: '/admin/reports', icon: AlertTriangle, label: 'Denúncias' },
]

export default function AdminNav() {
  const path = usePathname()

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-dark-800 border-r border-dark-600 flex-col z-40">
      <div className="p-6 border-b border-dark-600">
        <Link href="/admin" className="flex items-center gap-2">
          <Crown className="text-gold-500" size={22} />
          <span className="font-bold text-gradient-gold">Clube Elite</span>
        </Link>
        <p className="text-xs text-dark-400 mt-1">Painel Administrativo</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, icon: Icon, label, exact }) => {
          const active = exact ? path === href : path.startsWith(href)
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${active ? 'bg-gold-500/15 text-gold-400 font-medium' : 'text-dark-200 hover:text-dark-50 hover:bg-dark-700'}`}>
              <Icon size={18} />{label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-dark-600">
        <button onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-dark-200 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut size={18} />Sair
        </button>
      </div>
    </aside>
  )
}

