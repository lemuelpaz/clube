'use client'

import { useState, useEffect } from 'react'
import { Shield, UserX, UserCheck, Ban, Search, Filter } from 'lucide-react'
import { timeAgo, calculateAge } from '@/lib/utils'

interface UserData {
  id: string; name: string; email: string; role: string; status: string
  verified: boolean; city?: string; state?: string; birthDate?: string
  photos: string[]; createdAt: string; lastSeen?: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [acting, setActing] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    if (data.users) setUsers(data.users.filter((u: UserData) => u.role !== 'ADMIN'))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAction(userId: string, action: string) {
    setActing(userId)
    await fetch('/api/admin/users', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action }),
    })
    await load(); setActing(null)
  }

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const statusBadge = (s: string) => ({
    ACTIVE: <span className="text-xs bg-green-400/10 text-green-400 px-2 py-0.5 rounded-full">Ativo</span>,
    SUSPENDED: <span className="text-xs bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded-full">Suspenso</span>,
    BANNED: <span className="text-xs bg-red-400/10 text-red-400 px-2 py-0.5 rounded-full">Banido</span>,
  }[s] ?? null)

  return (
    <div className="min-h-screen pb-8">
      <div className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-lg border-b border-dark-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <h1 className="text-xl font-bold">Usuários</h1>
          <span className="text-sm text-dark-400">{filtered.length} usuários</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-4">
        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="w-full bg-dark-800 border border-dark-600 rounded-xl pl-9 pr-4 py-2.5 text-sm text-dark-50 placeholder-dark-400 focus:outline-none focus:border-gold-500/50" />
          </div>
          {(['ALL', 'MALE', 'FEMALE'] as const).map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${roleFilter === r ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' : 'bg-dark-800 border border-dark-600 text-dark-300 hover:text-dark-50'}`}>
              {r === 'ALL' ? 'Todos' : r === 'MALE' ? 'Homens' : 'Mulheres'}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-dark-800 border border-dark-600 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-600">
                  <th className="text-left px-5 py-3 text-xs font-medium text-dark-400">Usuário</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-dark-400 hidden md:table-cell">Tipo</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-dark-400 hidden lg:table-cell">Local</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-dark-400">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-dark-400 hidden md:table-cell">Cadastro</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-dark-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-dark-700">
                      <td colSpan={6} className="px-5 py-4"><div className="h-6 bg-dark-700 rounded animate-pulse" /></td>
                    </tr>
                  ))
                ) : filtered.map(u => {
                  const age = u.birthDate ? calculateAge(u.birthDate) : null
                  return (
                    <tr key={u.id} className="border-b border-dark-700 hover:bg-dark-700/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-dark-600 shrink-0">
                            {u.photos[0] ? (
                              <img src={u.photos[0]} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gold-400">{u.name[0]}</div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium">{u.name}</p>
                              {u.verified && <Shield size={11} className="text-gold-400" />}
                            </div>
                            <p className="text-xs text-dark-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'MALE' ? 'bg-blue-400/10 text-blue-400' : 'bg-pink-400/10 text-pink-400'}`}>
                          {u.role === 'MALE' ? 'Homem' : 'Mulher'}
                          {age ? ` · ${age}a` : ''}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-dark-300 hidden lg:table-cell">
                        {[u.city, u.state].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="px-5 py-4">{statusBadge(u.status)}</td>
                      <td className="px-5 py-4 text-xs text-dark-400 hidden md:table-cell">{timeAgo(u.createdAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {u.status === 'ACTIVE' && (
                            <>
                              <button onClick={() => handleAction(u.id, 'suspend')} disabled={acting === u.id}
                                className="p-1.5 text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors" title="Suspender">
                                <UserX size={14} />
                              </button>
                              <button onClick={() => handleAction(u.id, 'ban')} disabled={acting === u.id}
                                className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Banir">
                                <Ban size={14} />
                              </button>
                            </>
                          )}
                          {(u.status === 'SUSPENDED' || u.status === 'BANNED') && (
                            <button onClick={() => handleAction(u.id, 'activate')} disabled={acting === u.id}
                              className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors" title="Reativar">
                              <UserCheck size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!loading && filtered.length === 0 && (
              <div className="text-center py-12 text-dark-400">Nenhum usuário encontrado.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

