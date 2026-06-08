'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import type { Session } from 'next-auth'
import { Crown, Compass, Heart, MessageCircle, User, Star, Settings, LogOut, Shield, Wallet } from 'lucide-react'

interface Props { session: Session }

const MALE_MOBILE_NAV = [
  { href: '/discover', icon: Compass, label: 'Descobrir' },
  { href: '/matches', icon: Heart, label: 'Matches' },
  { href: '/messages', icon: MessageCircle, label: 'Chat' },
  { href: '/favorites', icon: Star, label: 'Favoritos' },
  { href: '/profile', icon: User, label: 'Perfil' },
]

const FEMALE_MOBILE_NAV = [
  { href: '/discover', icon: Compass, label: 'Descobrir' },
  { href: '/matches', icon: Heart, label: 'Matches' },
  { href: '/messages', icon: MessageCircle, label: 'Chat' },
  { href: '/earnings', icon: Wallet, label: 'Ganhos' },
  { href: '/profile', icon: User, label: 'Perfil' },
]

const SIDEBAR_NAV = [
  { href: '/discover', icon: Compass, label: 'Descobrir' },
  { href: '/matches', icon: Heart, label: 'Matches' },
  { href: '/messages', icon: MessageCircle, label: 'Mensagens' },
  { href: '/favorites', icon: Star, label: 'Favoritos' },
  { href: '/profile', icon: User, label: 'Perfil' },
  { href: '/subscription', icon: Crown, label: 'Assinatura' },
]

export default function AppNav({ session }: Props) {
  const path = usePathname()
  const user = session.user as any
  const mobileNav = user.role === 'FEMALE' ? FEMALE_MOBILE_NAV : MALE_MOBILE_NAV

  const [totalUnread, setTotalUnread] = useState(0)

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch('/api/matches')
        if (!res.ok) return
        const data = await res.json()
        const count = (data.matches ?? []).reduce((sum: number, m: any) => sum + (m.unreadCount ?? 0), 0)
        setTotalUnread(count)
      } catch {}
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-dark-800 border-r border-dark-600 flex-col z-40">
        <div className="p-6 border-b border-dark-600">
          <Link href="/discover" className="flex items-center gap-2">
            <Crown className="text-gold-500" size={22} />
            <span className="font-bold text-gradient-gold">Clube Elite</span>
          </Link>
        </div>

        <div className="p-4 border-b border-dark-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold text-sm">
              {user.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user.name}</p>
              <p className="text-xs text-dark-300">{user.role === 'MALE' ? 'Assinante' : 'Membro'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {SIDEBAR_NAV.map(({ href, icon: Icon, label }) => {
            const active = path.startsWith(href)
            const isMessages = href === '/messages'
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${active ? 'bg-gold-500/15 text-gold-400 font-medium' : 'text-dark-200 hover:text-dark-50 hover:bg-dark-700'}`}>
                <span className="relative shrink-0">
                  <Icon size={18} />
                  {isMessages && totalUnread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center leading-none">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            )
          })}

          {user.role === 'FEMALE' && (
            <>
              <Link href="/verification"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${path.startsWith('/verification') ? 'bg-gold-500/15 text-gold-400 font-medium' : 'text-dark-200 hover:text-dark-50 hover:bg-dark-700'}`}>
                <Shield size={18} />
                Verificação
              </Link>
              <Link href="/earnings"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${path.startsWith('/earnings') ? 'bg-gold-500/15 text-gold-400 font-medium' : 'text-dark-200 hover:text-dark-50 hover:bg-dark-700'}`}>
                <Wallet size={18} />
                Ganhos
              </Link>
            </>
          )}
        </nav>

        <div className="p-3 border-t border-dark-600 space-y-1">
          <Link href="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-dark-200 hover:text-dark-50 hover:bg-dark-700 transition-all">
            <Settings size={18} />
            Configurações
          </Link>
          <button onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-dark-200 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-800/95 backdrop-blur-sm border-t border-dark-600 z-50">
        <div className="flex items-center justify-around px-1 py-2 safe-area-bottom">
          {mobileNav.map(({ href, icon: Icon, label }) => {
            const active = path === href || (href !== '/discover' && path.startsWith(href))
            const isMessages = href === '/messages'
            return (
              <Link key={href} href={href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-0 ${active ? 'text-gold-400' : 'text-dark-300 hover:text-dark-100'}`}>
                <span className="relative">
                  <Icon size={21} />
                  {isMessages && totalUnread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center leading-none">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </span>
                <span className="text-[9px] font-medium truncate">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

