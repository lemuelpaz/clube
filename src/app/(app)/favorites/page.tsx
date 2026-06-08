'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, Shield, MapPin, Heart } from 'lucide-react'
import { calculateAge } from '@/lib/utils'

interface Profile {
  id: string; name: string; photos: string[]; birthDate?: string
  city?: string; state?: string; verified: boolean; bio?: string
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/favorites').then(r => r.json()).then(d => {
      if (d.favorites) setFavorites(d.favorites)
      setLoading(false)
    })
  }, [])

  async function removeFavorite(id: string) {
    await fetch('/api/favorites', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favoriteUserId: id }),
    })
    setFavorites(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-lg border-b border-dark-700 px-6 py-4">
        <h1 className="text-xl font-bold max-w-5xl mx-auto">Favoritos</h1>
      </div>
      <div className="max-w-5xl mx-auto p-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl bg-dark-800 animate-pulse" />)}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-24">
            <Star size={48} className="mx-auto mb-4 text-dark-600" />
            <p className="text-dark-300">Nenhum perfil favoritado ainda.</p>
            <Link href="/discover" className="inline-block mt-4 bg-gold-500 hover:bg-gold-400 text-dark-50 font-bold px-6 py-3 rounded-full text-sm transition-colors">
              Descobrir Perfis
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {favorites.map(p => {
              const age = p.birthDate ? calculateAge(p.birthDate) : null
              return (
                <div key={p.id} className="group relative rounded-2xl overflow-hidden bg-dark-800 border border-dark-600 hover:border-gold-500/30 transition-all card-hover">
                  <Link href={`/profile/${p.id}`}>
                    <div className="aspect-[3/4] relative overflow-hidden bg-dark-700">
                      {p.photos[0] ? (
                        <img src={p.photos[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-dark-500">{p.name[0]}</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-transparent to-transparent" />
                      {p.verified && (
                        <div className="absolute top-2 right-2 bg-gold-500/90 rounded-full p-1"><Shield size={12} className="text-dark-50" /></div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="font-bold text-sm">{p.name}{age ? `, ${age}` : ''}</p>
                        {(p.city || p.state) && (
                          <p className="text-xs text-dark-200 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} />{[p.city, p.state].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="p-2">
                    <button onClick={() => removeFavorite(p.id)}
                      className="w-full py-2 rounded-xl bg-gold-500/20 text-gold-400 hover:bg-red-500/20 hover:text-red-400 transition-colors flex items-center justify-center gap-1.5 text-xs font-medium">
                      <Star size={14} className="fill-current" />Remover
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

