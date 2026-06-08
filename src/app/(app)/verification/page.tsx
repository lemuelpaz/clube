'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Shield, Upload, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface Verification {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  rejectionReason?: string
}

export default function VerificationPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [verif, setVerif] = useState<Verification | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [docUrl, setDocUrl] = useState('')
  const [selfieUrl, setSelfieUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch('/api/verification').then(r => r.json()).then(d => {
      if (d.verification) setVerif(d.verification)
      setLoading(false)
    })
  }, [])

  async function handleSubmit() {
    if (!docUrl || !selfieUrl) return
    setSubmitting(true)
    const res = await fetch('/api/verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentUrl: docUrl, selfieUrl }),
    })
    const data = await res.json()
    if (data.verification) { setVerif(data.verification); setSubmitted(true) }
    setSubmitting(false)
  }

  if (user?.role !== 'FEMALE') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <Shield className="text-gold-400 mx-auto mb-4" size={48} />
          <p className="text-dark-300">Esta página é apenas para perfis femininos.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
    </div>
  }

  // Already verified
  if (verif?.status === 'APPROVED') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass rounded-2xl p-10 border border-green-500/20 text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-400" size={40} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Perfil Verificado!</h2>
          <p className="text-dark-200 mb-6">Seu perfil possui o selo de verificação. Você pode usar a plataforma normalmente.</p>
          <div className="flex items-center justify-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-xl px-4 py-3 mb-6">
            <Shield size={16} className="text-gold-400" />
            <span className="text-sm text-gold-400 font-medium">Perfil Verificado ✓</span>
          </div>
          <Link href="/discover" className="bg-gold-500 hover:bg-gold-400 text-dark-50 font-bold px-6 py-3 rounded-full text-sm transition-colors">
            Descobrir Perfis
          </Link>
        </div>
      </div>
    )
  }

  // Pending
  if (verif?.status === 'PENDING') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass rounded-2xl p-10 border border-gold-500/10 text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-6">
            <Clock className="text-gold-400" size={40} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Em Análise</h2>
          <p className="text-dark-200 mb-4">Seus documentos foram enviados e estão sendo analisados pela nossa equipe.</p>
          <p className="text-sm text-dark-300">Prazo: até 24 horas úteis</p>
        </div>
      </div>
    )
  }

  // Rejected
  if (verif?.status === 'REJECTED') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass rounded-2xl p-10 border border-red-500/20 text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <XCircle className="text-red-400" size={40} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Verificação Rejeitada</h2>
          {verif.rejectionReason && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 text-sm text-red-300">
              {verif.rejectionReason}
            </div>
          )}
          <button onClick={() => setVerif(null)} className="bg-gold-500 hover:bg-gold-400 text-dark-50 font-bold px-6 py-3 rounded-full text-sm transition-colors">
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  // Submission form
  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-lg border-b border-dark-700 px-6 py-4">
        <h1 className="text-xl font-bold max-w-2xl mx-auto">Verificação de Identidade</h1>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="glass rounded-2xl p-6 border border-gold-500/10">
          <div className="flex items-start gap-3 mb-6">
            <AlertTriangle className="text-gold-400 shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-dark-200">
              Para garantir a segurança da plataforma, todas as mulheres precisam verificar sua identidade.
              Seus documentos são tratados com total confidencialidade.
            </p>
          </div>

          {/* Steps */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? 'bg-gold-500 text-dark-50' : 'bg-dark-700 text-dark-400'}`}>
                  {step > s ? '✓' : s}
                </div>
                {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-gold-500' : 'bg-dark-700'}`} style={{ width: '40px' }} />}
              </div>
            ))}
            <div className="ml-4 text-sm text-dark-300">
              {step === 1 ? 'Documento oficial' : step === 2 ? 'Selfie com documento' : 'Revisar e enviar'}
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold">Etapa 1 — Documento Oficial</h3>
              <p className="text-sm text-dark-300">Envie uma foto clara do seu RG, CNH ou passaporte.</p>
              <div className="border-2 border-dashed border-dark-500 rounded-xl p-8 text-center">
                <Upload className="text-dark-400 mx-auto mb-3" size={32} />
                <p className="text-sm text-dark-300 mb-2">Arraste ou clique para selecionar</p>
                <input type="text" placeholder="URL da imagem do documento (demo)"
                  value={docUrl} onChange={e => setDocUrl(e.target.value)}
                  className="w-full bg-dark-800 border border-dark-500 rounded-lg px-3 py-2 text-sm text-dark-50 focus:outline-none focus:border-gold-500/50" />
              </div>
              <button onClick={() => docUrl && setStep(2)} disabled={!docUrl}
                className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-40 text-dark-50 font-bold py-3 rounded-xl transition-colors">
                Continuar
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold">Etapa 2 — Selfie com Documento</h3>
              <p className="text-sm text-dark-300">Tire uma selfie segurando o documento ao lado do rosto.</p>
              <div className="border-2 border-dashed border-dark-500 rounded-xl p-8 text-center">
                <Upload className="text-dark-400 mx-auto mb-3" size={32} />
                <p className="text-sm text-dark-300 mb-2">Arraste ou clique para selecionar</p>
                <input type="text" placeholder="URL da selfie com documento (demo)"
                  value={selfieUrl} onChange={e => setSelfieUrl(e.target.value)}
                  className="w-full bg-dark-800 border border-dark-500 rounded-lg px-3 py-2 text-sm text-dark-50 focus:outline-none focus:border-gold-500/50" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-dark-500 text-dark-200 font-medium py-3 rounded-xl transition-colors hover:bg-dark-700">Voltar</button>
                <button onClick={() => selfieUrl && setStep(3)} disabled={!selfieUrl}
                  className="flex-1 bg-gold-500 hover:bg-gold-400 disabled:opacity-40 text-dark-50 font-bold py-3 rounded-xl transition-colors">
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold">Etapa 3 — Revisar e Enviar</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-dark-800 border border-dark-600">
                  <p className="text-xs text-dark-400 mb-1">Documento</p>
                  <p className="text-xs text-green-400">✓ Enviado</p>
                </div>
                <div className="p-3 rounded-xl bg-dark-800 border border-dark-600">
                  <p className="text-xs text-dark-400 mb-1">Selfie</p>
                  <p className="text-xs text-green-400">✓ Enviado</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gold-500/5 border border-gold-500/20 text-sm text-dark-200">
                Nossa equipe irá analisar seus documentos em até 24 horas. Você receberá uma notificação quando for aprovada.
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 border border-dark-500 text-dark-200 font-medium py-3 rounded-xl transition-colors hover:bg-dark-700">Voltar</button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 bg-gold-500 hover:bg-gold-400 disabled:opacity-40 text-dark-50 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                  {submitting ? <div className="w-5 h-5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" /> : <><Shield size={16} />Enviar para Análise</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

