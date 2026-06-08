import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import AdminNav from '@/components/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') redirect('/login')

  return (
    <div className="min-h-screen bg-dark-900 flex">
      <AdminNav />
      <main className="flex-1 md:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  )
}
