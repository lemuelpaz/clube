import Link from 'next/link'
import { Crown } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gold-500/5 rounded-full blur-3xl" />
      </div>
      <header className="relative z-10 p-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <Crown className="text-gold-500" size={22} />
          <span className="text-lg font-bold text-gradient-gold">Clube Elite</span>
        </Link>
      </header>
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>
    </div>
  )
}
