'use client'

import { AlertTriangle } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="min-h-screen pb-8">
      <div className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-lg border-b border-dark-700 px-6 py-4">
        <h1 className="text-xl font-bold">Denúncias</h1>
      </div>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-dark-400">
          <AlertTriangle size={40} className="mx-auto mb-3 opacity-30" />
          <p>Nenhuma denúncia registrada.</p>
        </div>
      </div>
    </div>
  )
}
