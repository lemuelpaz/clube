import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/components/providers/SessionProvider'
import PrintProtection from '@/components/PrintProtection'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Clube Elite — Conexões Exclusivas',
  description: 'A plataforma premium que conecta homens de alto padrão com mulheres verificadas.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-dark-900 text-dark-50 antialiased">
        <SessionProvider>
          <PrintProtection />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}

