'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
  Shield, MapPin, Camera, Plus, X, Edit2, Save,
  Check, Grid3X3, LogOut, Settings, EyeOff, Eye
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { calculateAge, isOnline, INTERESTS } from '@/lib/utils'
import LocationPicker from '@/components/LocationPicker'

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

export default function MyProfilePage() {
  const { data: session } = useSession()
  const user = session?.user as any

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Bio inline edit
  const [editingBio, setEditingBio] = useState(false)
  const [bioValue, setBioValue] = useState('')
  const [savingBio, setSavingBio] = useState(false)

  // Info modal
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [infoForm, setInfoForm] = useState<any>({})
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [savingInfo, setSavingInfo] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Photos
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const avatarFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user?.id) return
    fetch(`/api/users/${user.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setProfile(d.user)
          setBioValue(d.user.bio ?? '')
          setInfoForm({
            name: d.user.name ?? '',
            phone: d.user.phone ?? '',
            birthDate: d.user.birthDate ?? '',
            city: d.user.city ?? '',
            state: d.user.state ?? '',
          })
          setSelectedInterests(d.user.interests ?? [])
        }
        setLoading(false)
      })
  }, [user?.id])

  async function patchUser(updates: Record<string, unknown>) {
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar')
    if (data.user) setProfile(data.user)
    return data.user
  }

  async function saveBio() {
    setSavingBio(true)
    try { await patchUser({ bio: bioValue }) } catch {}
    setEditingBio(false)
    setSavingBio(false)
  }

  async function saveInfo() {
    setSavingInfo(true)
    setSaveError('')
    try {
      await patchUser({ ...infoForm, interests: selectedInterests })
      setShowInfoModal(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      setSaveError(err?.message ?? 'Erro ao salvar. Tente novamente.')
    }
    setSavingInfo(false)
  }

  async function toggleHidden() {
    const next = !profile.hidden
    await patchUser({ hidden: next })
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploadingPhoto(true)
    const compressed = await Promise.all(files.map(compressImage))
    const newPhotos = [...(profile.photos ?? []), ...compressed]
    await patchUser({ photos: newPhotos })
    setUploadingPhoto(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function deletePhoto(idx: number) {
    const newPhotos = (profile.photos ?? []).filter((_: string, i: number) => i !== idx)
    await patchUser({ photos: newPhotos })
    if (lightboxIdx !== null) setLightboxIdx(null)
  }

  async function handleChangeProfilePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    setShowAvatarMenu(false)
    const compressed = await compressImage(file)
    const current: string[] = profile.photos ?? []
    // Replace index 0 (profile photo), keep the rest
    const newPhotos = [compressed, ...current.slice(1)]
    await patchUser({ photos: newPhotos })
    setUploadingPhoto(false)
    if (avatarFileRef.current) avatarFileRef.current.value = ''
  }

  function toggleInterest(i: string) {
    setSelectedInterests(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : prev.length < 8 ? [...prev, i] : prev
    )
  }

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    )
  }

  const age = profile.birthDate ? calculateAge(profile.birthDate) : null
  const online = isOnline(profile.lastSeen)
  const photos: string[] = profile.photos ?? []

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-dark-800/90 backdrop-blur-lg border-b border-dark-700/60 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-sm">Meu Perfil</span>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-1.5 text-xs text-dark-300 hover:text-red-400 transition-colors px-2 py-1"
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>

      {/* Cover */}
      <div className="relative">
        <div
          className="h-40 w-full"
          style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #3A0610 50%, #C41E3A 100%)' }}
        />

        {/* Avatar */}
        <div className="absolute left-5 -bottom-14">
          <div className="relative">
            <button
              onClick={() => setShowAvatarMenu(v => !v)}
              className="relative group block"
            >
              <div className="w-28 h-28 rounded-full border-4 border-dark-800 overflow-hidden bg-dark-700 shadow-xl">
                {uploadingPhoto ? (
                  <div className="w-full h-full flex items-center justify-center bg-dark-800">
                    <div className="w-6 h-6 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
                  </div>
                ) : photos[0] ? (
                  <img src={photos[0]} alt={profile.name} className="w-full h-full object-cover" draggable={false} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gold-400">
                    {profile.name?.[0]}
                  </div>
                )}
              </div>
              {online && !uploadingPhoto && (
                <span className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full bg-green-400 border-2 border-dark-800 shadow" />
              )}
              {/* Camera badge */}
              <span className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-dark-700 border-2 border-dark-800 flex items-center justify-center shadow">
                <Camera size={13} className="text-gold-400" />
              </span>
            </button>

            {/* Avatar context menu */}
            {showAvatarMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAvatarMenu(false)} />
                <div className="absolute left-0 top-full mt-2 z-50 bg-dark-700 border border-dark-500 rounded-xl shadow-xl overflow-hidden w-52">
                  <button
                    onClick={() => avatarFileRef.current?.click()}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-dark-100 hover:bg-dark-600 transition-colors text-left"
                  >
                    <Camera size={15} className="text-gold-400 shrink-0" />
                    Alterar foto de perfil
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Hidden input for replacing profile photo */}
        <input
          ref={avatarFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChangeProfilePhoto}
        />

        {/* Edit info button */}
        <div className="absolute right-4 bottom-3">
          <button
            onClick={() => setShowInfoModal(true)}
            className="flex items-center gap-1.5 bg-dark-700/80 hover:bg-dark-600 border border-dark-500 text-dark-50 text-sm font-medium px-4 py-2 rounded-full transition-all"
          >
            <Settings size={14} />
            Editar perfil
          </button>
        </div>
      </div>

      {/* Profile info */}
      <div className="px-5 pt-16 pb-4">
        <div className="flex items-start gap-2">
          <h1 className="text-xl font-bold">{profile.name}{age ? `, ${age}` : ''}</h1>
          {profile.verified && (
            <span className="mt-1 bg-gold-500/20 border border-gold-500/30 rounded-full p-1 shrink-0">
              <Shield size={12} className="text-gold-400" />
            </span>
          )}
        </div>
        {(profile.city || profile.state) && (
          <p className="text-dark-300 text-sm flex items-center gap-1 mt-0.5">
            <MapPin size={12} />
            {[profile.city, profile.state].filter(Boolean).join(', ')}
          </p>
        )}

        {/* Stats */}
        <div className="flex gap-6 mt-4 py-3 border-y border-dark-700/50">
          <div className="text-center">
            <p className="font-bold text-lg leading-none">{photos.length}</p>
            <p className="text-xs text-dark-300 mt-0.5">fotos</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg leading-none">{profile.interests?.length ?? 0}</p>
            <p className="text-xs text-dark-300 mt-0.5">interesses</p>
          </div>
          <div className="text-center">
            <div className={`flex items-center gap-1 font-bold text-sm leading-none ${online ? 'text-green-400' : 'text-dark-300'}`}>
              <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-400' : 'bg-dark-400'}`} />
              {online ? 'Online' : 'Offline'}
            </div>
            <p className="text-xs text-dark-300 mt-0.5">status</p>
          </div>
        </div>

        {/* Hidden profile toggle */}
        <button
          onClick={toggleHidden}
          className={`mt-3 w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
            profile.hidden
              ? 'bg-dark-700/80 border-dark-500 text-dark-100'
              : 'bg-dark-800/60 border-dark-600/60 text-dark-300 hover:border-dark-500'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {profile.hidden
              ? <EyeOff size={16} className="text-yellow-400 shrink-0" />
              : <Eye size={16} className="text-dark-400 shrink-0" />
            }
            <div className="text-left">
              <p className="text-sm font-medium leading-tight">
                {profile.hidden ? 'Perfil oculto' : 'Perfil visível'}
              </p>
              <p className="text-[11px] text-dark-400 mt-0.5">
                {profile.hidden
                  ? 'Você não aparece em Descobrir. Seus matches continuam ativos.'
                  : 'Seu perfil aparece para outros usuários em Descobrir.'
                }
              </p>
            </div>
          </div>
          {/* Toggle pill */}
          <div className={`relative w-10 h-5.5 h-[22px] rounded-full transition-colors shrink-0 ${profile.hidden ? 'bg-yellow-500' : 'bg-dark-500'}`}>
            <span className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-all ${profile.hidden ? 'left-[calc(100%-20px)]' : 'left-0.5'}`} />
          </div>
        </button>

        {/* Bio */}
        <div className="mt-3">
          {editingBio ? (
            <div className="space-y-2">
              <textarea
                value={bioValue}
                onChange={e => setBioValue(e.target.value)}
                rows={3}
                autoFocus
                placeholder="Escreva algo sobre você..."
                className="w-full bg-dark-700 border border-gold-500/30 rounded-xl px-4 py-3 text-sm text-dark-50 placeholder-dark-400 focus:outline-none resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingBio(false); setBioValue(profile.bio ?? '') }}
                  className="flex-1 py-2 rounded-xl text-sm border border-dark-500 text-dark-300 hover:text-dark-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveBio}
                  disabled={savingBio}
                  className="flex-1 py-2 rounded-xl text-sm font-bold bg-gold-500 hover:bg-gold-400 text-dark-50 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                >
                  {savingBio ? <div className="w-3.5 h-3.5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" /> : <><Check size={14} />Salvar</>}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditingBio(true)}
              className="w-full text-left group"
            >
              <p className={`text-sm leading-relaxed ${profile.bio ? 'text-dark-100' : 'text-dark-400 italic'}`}>
                {profile.bio || 'Adicionar bio...'}
              </p>
              <span className="text-xs text-gold-400/60 group-hover:text-gold-400 flex items-center gap-1 mt-1 transition-colors">
                <Edit2 size={11} />
                Editar bio
              </span>
            </button>
          )}
        </div>

        {/* Interests display */}
        {profile.interests?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {profile.interests.map((i: string) => (
              <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-dark-700/60 border border-dark-600/60 text-dark-100">
                {i}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Photos grid */}
      <div>
        <div className="flex items-center justify-between px-5 mb-2">
          <div className="flex items-center gap-2">
            <Grid3X3 size={15} className="text-dark-300" />
            <span className="text-xs text-dark-300 font-medium uppercase tracking-wider">Fotos</span>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadingPhoto}
            className="flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300 transition-colors disabled:opacity-50"
          >
            {uploadingPhoto
              ? <div className="w-3.5 h-3.5 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
              : <Plus size={14} />
            }
            Adicionar
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handlePhotoUpload}
        />

        {photos.length === 0 ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="mx-5 flex flex-col items-center justify-center gap-3 py-14 rounded-2xl border-2 border-dashed border-dark-600 hover:border-gold-500/30 transition-colors w-[calc(100%-2.5rem)]"
          >
            <Camera size={32} className="text-dark-500" />
            <p className="text-sm text-dark-400">Adicione suas primeiras fotos</p>
            <span className="text-xs text-gold-400">Toque para selecionar</span>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {photos.map((photo, i) => (
              <div key={i} className="aspect-square overflow-hidden bg-dark-700 relative group">
                <img
                  src={photo}
                  alt={`foto ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                  draggable={false}
                  onClick={() => setLightboxIdx(i)}
                />
                {i === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 bg-gold-500/90 text-dark-900 text-[9px] font-bold px-1.5 py-0.5 rounded-md pointer-events-none">
                    Principal
                  </span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); deletePhoto(i) }}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center opacity-60 hover:opacity-100 group-hover:opacity-100 active:opacity-100 transition-opacity hover:bg-red-500/80"
                >
                  <X size={13} className="text-white" />
                </button>
              </div>
            ))}
            {/* Add more button */}
            <button
              onClick={() => fileRef.current?.click()}
              className="aspect-square bg-dark-700/50 border border-dashed border-dark-500 hover:border-gold-500/40 flex items-center justify-center transition-colors group"
            >
              <Plus size={20} className="text-dark-400 group-hover:text-gold-400 transition-colors" />
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIdx(null)}
        >
          <button className="absolute top-5 right-5 text-dark-50/60 hover:text-dark-50 p-2" onClick={() => setLightboxIdx(null)}>
            <X size={24} />
          </button>
          <button
            className="absolute top-5 left-5 flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/40 text-red-400 text-sm px-3 py-1.5 rounded-xl transition-colors"
            onClick={() => deletePhoto(lightboxIdx)}
          >
            <X size={14} />
            Apagar foto
          </button>
          <div className="w-full max-w-lg px-4" onClick={e => e.stopPropagation()}>
            <img
              src={photos[lightboxIdx]}
              alt={`foto ${lightboxIdx + 1}`}
              className="w-full rounded-xl max-h-[80vh] object-contain"
              draggable={false}
            />
            {photos.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${i === lightboxIdx ? 'bg-gold-500 w-4' : 'bg-dark-400 w-1.5'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast de sucesso */}
      {saveSuccess && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[80] bg-green-600 text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg animate-bounce-once">
          Perfil atualizado com sucesso!
        </div>
      )}

      {/* Info edit modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass rounded-2xl border border-dark-500/60 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-dark-600/60 sticky top-0 bg-dark-800/95 backdrop-blur-lg rounded-t-2xl">
              <h3 className="font-bold">Editar perfil</h3>
              <button onClick={() => setShowInfoModal(false)} className="text-dark-300 hover:text-dark-50 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs text-dark-400 mb-1.5 block">Nome</label>
                <input
                  value={infoForm.name}
                  onChange={e => setInfoForm((f: any) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-dark-700 border border-dark-500 rounded-xl px-4 py-2.5 text-sm text-dark-50 focus:outline-none focus:border-gold-500/40 transition-colors"
                />
              </div>

              {/* Birth date + phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-dark-400 mb-1.5 block">Data de nascimento</label>
                  <input
                    type="date"
                    value={infoForm.birthDate}
                    onChange={e => setInfoForm((f: any) => ({ ...f, birthDate: e.target.value }))}
                    className="w-full bg-dark-700 border border-dark-500 rounded-xl px-3 py-2.5 text-sm text-dark-50 focus:outline-none focus:border-gold-500/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1.5 block">Telefone</label>
                  <input
                    value={infoForm.phone}
                    onChange={e => setInfoForm((f: any) => ({ ...f, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-dark-700 border border-dark-500 rounded-xl px-3 py-2.5 text-sm text-dark-50 focus:outline-none focus:border-gold-500/40 transition-colors"
                  />
                </div>
              </div>

              {/* Localização com GPS */}
              <LocationPicker
                state={infoForm.state ?? ''}
                city={infoForm.city ?? ''}
                onChange={(st, ct) => setInfoForm((f: any) => ({ ...f, state: st, city: ct }))}
                inputClass="w-full bg-dark-700 border border-dark-500 rounded-xl px-3 py-2.5 text-sm text-dark-50 placeholder-dark-400 focus:outline-none focus:border-gold-500/40 transition-colors"
                labelClass="text-xs text-dark-400 mb-1.5 block"
              />

              {/* Interests */}
              <div>
                <label className="text-xs text-dark-400 mb-2 block">
                  Interesses <span className="text-dark-500">({selectedInterests.length}/8)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(i => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleInterest(i)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedInterests.includes(i)
                        ? 'bg-gold-500/20 border border-gold-500/50 text-gold-400'
                        : 'bg-dark-700 border border-dark-500 text-dark-200 hover:border-gold-500/30'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              {saveError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-500">
                  {saveError}
                </div>
              )}
            </div>

            {/* Botão sticky sempre visível */}
            <div className="sticky bottom-0 px-5 pb-5 pt-3 bg-dark-800/95 border-t border-dark-600/60 rounded-b-2xl">
              <button
                onClick={saveInfo}
                disabled={savingInfo}
                className="w-full py-3 rounded-xl font-bold bg-gold-500 hover:bg-gold-400 text-dark-50 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {savingInfo
                  ? <div className="w-4 h-4 border-2 border-dark-50/30 border-t-dark-50 rounded-full animate-spin" />
                  : <><Save size={16} />Salvar alterações</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

