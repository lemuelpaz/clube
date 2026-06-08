'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Crown, User, Heart, ChevronRight, Eye, EyeOff, Camera, Plus, X, ImageIcon } from 'lucide-react'
import { INTERESTS, formatCPF, validateCPF } from '@/lib/utils'
import LocationPicker from '@/components/LocationPicker'

type Step = 'role' | 'form' | 'questionnaire' | 'photos'

const LOOKING_FOR_OPTIONS = ['Companhia', 'Apoio financeiro', 'Viagens', 'Mentoria', 'Relação discreta']
const ALLOWANCE_OPTIONS = ['R$1.000 - R$3.000', 'R$3.000 - R$7.000', 'R$7.000 - R$15.000', 'Acima de R$15.000', 'Flexível']
const FREQUENCY_OPTIONS = ['1-2x por mês', '1x por semana', 'Mais de 1x/semana', 'Flexível']
const ACTIVITIES_OPTIONS = ['Jantares finos', 'Viagens nacionais', 'Viagens internacionais', 'Shows e eventos', 'Spa e beleza', 'Compras']
const AVAILABILITY_OPTIONS = ['Apenas fins de semana', 'Dias úteis', 'Flexível', 'Somente virtual']

async function compressImage(file: File): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const max = 900
      let { width, height } = img
      if (width > max || height > max) {
        if (width > height) { height = Math.round((height * max) / width); width = max }
        else { width = Math.round((width * max) / height); height = max }
      }
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.src = url
  })
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('role')
  const [role, setRole] = useState<'MALE' | 'FEMALE'>('MALE')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    birthDate: '', city: '', state: '', bio: '', cpf: '',
  })

  const [sugarProfile, setSugarProfile] = useState({
    lookingFor: [] as string[],
    allowanceRange: '',
    meetingFrequency: '',
    activities: [] as string[],
    availability: '',
    description: '',
  })

  // Photos step
  const [photos, setPhotos] = useState<string[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function toggleInterest(i: string) {
    setSelectedInterests(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : prev.length < 8 ? [...prev, i] : prev
    )
  }

  function toggleMulti(key: 'lookingFor' | 'activities', val: string) {
    setSugarProfile(p => ({
      ...p,
      [key]: p[key].includes(val) ? p[key].filter(x => x !== val) : [...p[key], val],
    }))
  }

  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, cpf: formatCPF(e.target.value) }))
  }

  function validateForm() {
    if (!form.name || !form.email || !form.password || !form.cpf) {
      setError('Preencha todos os campos obrigatórios'); return false
    }
    if (form.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres'); return false
    }
    if (!validateCPF(form.cpf)) {
      setError('CPF inválido. Verifique e tente novamente.'); return false
    }
    return true
  }

  function handleFormNext(e: React.FormEvent) {
    e.preventDefault()
    if (!validateForm()) return
    setError('')
    if (role === 'FEMALE') {
      setStep('questionnaire')
    } else {
      setStep('photos')
    }
  }

  async function handlePhotoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploadingPhoto(true)
    const compressed = await Promise.all(files.map(compressImage))
    setPhotos(prev => [...prev, ...compressed].slice(0, 6))
    setUploadingPhoto(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function removePhoto(idx: number) {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
  }

  async function submitRegistration() {
    setLoading(true); setError('')

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        cpf: form.cpf.replace(/\D/g, ''),
        role,
        interests: selectedInterests,
        sugarProfile: role === 'FEMALE' ? sugarProfile : undefined,
      }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Erro ao criar conta'); setLoading(false); return }

    const loginResult = await signIn('credentials', {
      email: form.email, password: form.password, redirect: false,
    })

    if (loginResult?.error) { setError('Conta criada mas erro ao entrar'); setLoading(false); return }

    // Save photos right after login if any were added
    if (photos.length > 0 && data.user?.id) {
      try {
        await fetch(`/api/users/${data.user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photos }),
        })
      } catch {}
    }

    if (role === 'FEMALE') router.push('/verification')
    else router.push('/subscription')
  }

  async function handleQuestionnaireSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sugarProfile.allowanceRange || !sugarProfile.meetingFrequency || !sugarProfile.availability) {
      setError('Preencha todos os campos do formulário'); return
    }
    if (sugarProfile.lookingFor.length === 0) {
      setError('Selecione o que você está procurando'); return
    }
    setError('')
    setStep('photos')
  }

  async function handlePhotosSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (photos.length === 0) {
      setError('Adicione pelo menos uma foto do seu perfil'); return
    }
    await submitRegistration()
  }

  // Step indicator
  const FEMALE_STEPS = ['Dados', 'Perfil', 'Fotos']
  const MALE_STEPS = ['Dados', 'Fotos']
  const STEPS = role === 'FEMALE' ? FEMALE_STEPS : MALE_STEPS
  const stepIndex = step === 'form' ? 0 : step === 'questionnaire' ? 1 : step === 'photos' ? (role === 'FEMALE' ? 2 : 1) : -1

  function StepBar() {
    if (stepIndex < 0) return null
    return (
      <div className="flex items-center mb-6">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1">
            <div className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 transition-all ${
                i < stepIndex ? 'bg-gold-500 text-dark-900' :
                i === stepIndex ? 'bg-gold-500/20 border-2 border-gold-500 text-gold-400' :
                'bg-dark-700 border border-dark-500 text-dark-400'
              }`}>
                {i < stepIndex ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium ${i === stepIndex ? 'text-gold-400' : i < stepIndex ? 'text-dark-200' : 'text-dark-500'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 ${i < stepIndex ? 'bg-gold-500/40' : 'bg-dark-600'}`} />
            )}
          </div>
        ))}
      </div>
    )
  }

  // ── ROLE STEP ──────────────────────────────────────────────────────────────
  if (step === 'role') {
    return (
      <div className="w-full max-w-lg">
        <div className="glass rounded-2xl p-8 border border-gold-500/10">
          <div className="text-center mb-8">
            <Crown className="text-gold-400 mx-auto mb-4" size={32} />
            <h1 className="text-2xl font-bold">Criar sua Conta</h1>
            <p className="text-dark-200 text-sm mt-1">Como você deseja se cadastrar?</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {([
              { value: 'MALE', icon: User, title: 'Sou Homem', desc: 'Assine e conheça perfis verificados' },
              { value: 'FEMALE', icon: Heart, title: 'Sou Mulher', desc: 'Cadastre-se gratuitamente' },
            ] as const).map(({ value, icon: Icon, title, desc }) => (
              <button
                key={value}
                onClick={() => { setRole(value); setStep('form') }}
                className="p-6 rounded-xl border border-dark-500 bg-dark-800 transition-all text-left hover:border-gold-500/50"
              >
                <Icon className="text-gold-400 mb-3" size={28} />
                <div className="font-bold mb-1">{title}</div>
                <div className="text-xs text-dark-300">{desc}</div>
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-dark-300">
            Já tem conta?{' '}
            <Link href="/login" className="text-gold-400 hover:text-gold-300 font-medium">Entrar</Link>
          </p>
        </div>
      </div>
    )
  }

  // ── PHOTOS STEP (FEMALE) ───────────────────────────────────────────────────
  if (step === 'photos') {
    return (
      <div className="w-full max-w-2xl">
        <div className="glass rounded-2xl p-8 border border-gold-500/10">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => { setStep(role === 'FEMALE' ? 'questionnaire' : 'form'); setError('') }} className="text-dark-300 hover:text-dark-50 transition-colors">←</button>
            <div>
              <h1 className="text-xl font-bold">Fotos do Perfil</h1>
              <p className="text-dark-200 text-sm">Adicione fotos para atrair mais matches</p>
            </div>
          </div>

          <StepBar />

          <form onSubmit={handlePhotosSubmit} className="space-y-5">
            <div className="bg-dark-700/40 border border-dark-600 rounded-xl px-4 py-3 text-sm text-dark-300 flex items-start gap-2">
              <ImageIcon size={15} className="shrink-0 mt-0.5 text-gold-400" />
              <span>Adicione ao menos <strong className="text-dark-100">1 foto</strong>. Perfis com fotos têm muito mais chance de match. Máx. 6 fotos.</span>
            </div>

            {/* Photo grid */}
            <div className="grid grid-cols-3 gap-3">
              {photos.map((src, idx) => (
                <div key={idx} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-dark-700 border border-dark-600 group">
                  <img src={src} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <div className="absolute top-1.5 left-1.5 bg-gold-500 text-dark-900 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                      Principal
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {photos.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="aspect-[3/4] rounded-xl border-2 border-dashed border-dark-500 hover:border-gold-500/50 bg-dark-800 hover:bg-dark-700 flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {uploadingPhoto ? (
                    <div className="w-6 h-6 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-dark-700 border border-dark-500 flex items-center justify-center">
                        <Plus size={18} className="text-dark-300" />
                      </div>
                      <span className="text-[11px] text-dark-400 text-center px-2">
                        {photos.length === 0 ? 'Adicionar foto' : 'Mais foto'}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoFiles}
            />

            {photos.length === 0 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full py-3 rounded-xl border-2 border-dashed border-gold-500/30 hover:border-gold-500/60 bg-gold-500/5 text-gold-400 text-sm font-medium flex items-center justify-center gap-2 transition-all"
              >
                <Camera size={16} />
                Escolher fotos da galeria
              </button>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || photos.length === 0}
              className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-dark-50 font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
              ) : (
                <><span>Finalizar Cadastro</span><ChevronRight size={18} /></>
              )}
            </button>

            <p className="text-center text-xs text-dark-400">
              Suas fotos só aparecem para usuários com match ou assinantes.
            </p>
          </form>
        </div>
      </div>
    )
  }

  // ── QUESTIONNAIRE STEP (FEMALE) ────────────────────────────────────────────
  if (step === 'questionnaire') {
    return (
      <div className="w-full max-w-2xl">
        <div className="glass rounded-2xl p-8 border border-gold-500/10">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => { setStep('form'); setError('') }} className="text-dark-300 hover:text-dark-50 transition-colors">←</button>
            <div>
              <h1 className="text-xl font-bold">Perfil</h1>
              <p className="text-dark-200 text-sm">Conte mais sobre o que você busca</p>
            </div>
          </div>

          <StepBar />

          <form onSubmit={handleQuestionnaireSubmit} className="space-y-6">
            {/* Q1: O que você procura */}
            <div>
              <label className="block text-sm font-semibold text-dark-100 mb-2">
                O que você procura nessa relação? <span className="text-gold-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {LOOKING_FOR_OPTIONS.map(opt => (
                  <button type="button" key={opt}
                    onClick={() => toggleMulti('lookingFor', opt)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all border ${sugarProfile.lookingFor.includes(opt)
                      ? 'bg-gold-500/20 border-gold-500/50 text-gold-400'
                      : 'border-dark-500 bg-dark-800 text-dark-200 hover:border-gold-500/30'
                    }`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Q2: Expectativa de mesada */}
            <div>
              <label className="block text-sm font-semibold text-dark-100 mb-2">
                Expectativa de mesada mensal <span className="text-gold-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {ALLOWANCE_OPTIONS.map(opt => (
                  <button type="button" key={opt}
                    onClick={() => setSugarProfile(p => ({ ...p, allowanceRange: opt }))}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all border ${sugarProfile.allowanceRange === opt
                      ? 'bg-gold-500/20 border-gold-500/50 text-gold-400'
                      : 'border-dark-500 bg-dark-800 text-dark-200 hover:border-gold-500/30'
                    }`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Q3: Frequência */}
            <div>
              <label className="block text-sm font-semibold text-dark-100 mb-2">
                Frequência de encontros preferida <span className="text-gold-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {FREQUENCY_OPTIONS.map(opt => (
                  <button type="button" key={opt}
                    onClick={() => setSugarProfile(p => ({ ...p, meetingFrequency: opt }))}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all border ${sugarProfile.meetingFrequency === opt
                      ? 'bg-gold-500/20 border-gold-500/50 text-gold-400'
                      : 'border-dark-500 bg-dark-800 text-dark-200 hover:border-gold-500/30'
                    }`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Q4: Atividades */}
            <div>
              <label className="block text-sm font-semibold text-dark-100 mb-2">
                Atividades que você aprecia
              </label>
              <div className="flex flex-wrap gap-2">
                {ACTIVITIES_OPTIONS.map(opt => (
                  <button type="button" key={opt}
                    onClick={() => toggleMulti('activities', opt)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all border ${sugarProfile.activities.includes(opt)
                      ? 'bg-gold-500/20 border-gold-500/50 text-gold-400'
                      : 'border-dark-500 bg-dark-800 text-dark-200 hover:border-gold-500/30'
                    }`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Q5: Disponibilidade */}
            <div>
              <label className="block text-sm font-semibold text-dark-100 mb-2">
                Disponibilidade <span className="text-gold-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABILITY_OPTIONS.map(opt => (
                  <button type="button" key={opt}
                    onClick={() => setSugarProfile(p => ({ ...p, availability: opt }))}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all border ${sugarProfile.availability === opt
                      ? 'bg-gold-500/20 border-gold-500/50 text-gold-400'
                      : 'border-dark-500 bg-dark-800 text-dark-200 hover:border-gold-500/30'
                    }`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Q6: Descrição livre */}
            <div>
              <label className="block text-sm font-semibold text-dark-100 mb-2">
                Como você se descreveria? (opcional)
              </label>
              <textarea
                value={sugarProfile.description}
                onChange={e => setSugarProfile(p => ({ ...p, description: e.target.value }))}
                placeholder="Escreva livremente..."
                rows={3}
                className="w-full bg-dark-700 border border-dark-400 rounded-xl px-4 py-3 text-sm text-dark-50 placeholder-dark-300 focus:outline-none focus:border-gold-500/50 transition-colors resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gold-500 hover:bg-gold-400 text-dark-50 font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>Próximo — Fotos</span><ChevronRight size={18} />
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── FORM STEP ──────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-2xl">
      <div className="glass rounded-2xl p-8 border border-gold-500/10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setStep('role')} className="text-dark-300 hover:text-dark-50 transition-colors">←</button>
          <div>
            <h1 className="text-xl font-bold">
              {role === 'MALE' ? 'Cadastro — Assinante' : 'Cadastro — Mulher Verificada'}
            </h1>
            <p className="text-dark-200 text-sm mt-0.5">
              {role === 'FEMALE' ? 'Gratuito — verificação obrigatória após cadastro' : 'Plano de assinatura após cadastro'}
            </p>
          </div>
        </div>

        <StepBar />

        <form onSubmit={handleFormNext} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-dark-100 mb-1.5">Nome completo *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Seu nome" required
              className="w-full bg-dark-700 border border-dark-400 rounded-xl px-4 py-3 text-sm text-dark-50 placeholder-dark-300 focus:outline-none focus:border-gold-500/50 transition-colors" />
          </div>

          {/* Email + CPF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-100 mb-1.5">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="seu@email.com" required
                className="w-full bg-dark-700 border border-dark-400 rounded-xl px-4 py-3 text-sm text-dark-50 placeholder-dark-300 focus:outline-none focus:border-gold-500/50 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-100 mb-1.5">CPF *</label>
              <input
                value={form.cpf} onChange={handleCpfChange}
                placeholder="000.000.000-00" required maxLength={14}
                className="w-full bg-dark-700 border border-dark-400 rounded-xl px-4 py-3 text-sm text-dark-50 placeholder-dark-300 focus:outline-none focus:border-gold-500/50 transition-colors" />
            </div>
          </div>

          {/* Senha + Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-100 mb-1.5">Senha *</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 6 caracteres" required
                  className="w-full bg-dark-700 border border-dark-400 rounded-xl px-4 py-3 pr-12 text-sm text-dark-50 placeholder-dark-300 focus:outline-none focus:border-gold-500/50 transition-colors" />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-300 hover:text-gold-400 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-100 mb-1.5">Telefone</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
                className="w-full bg-dark-700 border border-dark-400 rounded-xl px-4 py-3 text-sm text-dark-50 placeholder-dark-300 focus:outline-none focus:border-gold-500/50 transition-colors" />
            </div>
          </div>

          {/* Data de nascimento */}
          <div>
            <label className="block text-sm font-medium text-dark-100 mb-1.5">Data de Nascimento</label>
            <input type="date" value={form.birthDate} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))}
              className="w-full bg-dark-700 border border-dark-400 rounded-xl px-4 py-3 text-sm text-dark-50 focus:outline-none focus:border-gold-500/50 transition-colors" />
          </div>

          {/* Localização com GPS */}
          <LocationPicker
            state={form.state}
            city={form.city}
            onChange={(st, ct) => setForm(f => ({ ...f, state: st, city: ct }))}
            inputClass="w-full bg-dark-700 border border-dark-400 rounded-xl px-4 py-3 text-sm text-dark-50 placeholder-dark-300 focus:outline-none focus:border-gold-500/50 transition-colors"
          />

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-dark-100 mb-1.5">Sobre você</label>
            <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Escreva um pouco sobre você..." rows={3}
              className="w-full bg-dark-700 border border-dark-400 rounded-xl px-4 py-3 text-sm text-dark-50 placeholder-dark-300 focus:outline-none focus:border-gold-500/50 transition-colors resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-100 mb-2">Interesses (máx. 8)</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(interest => (
                <button
                  key={interest} type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedInterests.includes(interest)
                    ? 'bg-gold-500/20 border border-gold-500/50 text-gold-400'
                    : 'bg-dark-700 border border-dark-500 text-dark-200 hover:border-gold-500/30'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-dark-50 font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
            ) : (
              <><span>Próximo</span><ChevronRight size={18} /></>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-dark-300 mt-4">
          Já tem conta?{' '}
          <Link href="/login" className="text-gold-400 hover:text-gold-300 font-medium">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
