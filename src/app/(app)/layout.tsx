import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import AppNav from '@/components/AppNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="h-screen bg-dark-900 flex overflow-hidden">
      <AppNav session={session} />
      <main className="flex-1 md:ml-64 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
