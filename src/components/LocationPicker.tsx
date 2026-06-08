'use client'

import { useState, useEffect, useRef } from 'react'
import { Navigation, ChevronDown, Loader2 } from 'lucide-react'

const STATE_NAMES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas',
  BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo',
  GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
  PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
  SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
}

const NAME_TO_UF: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAMES).map(([k, v]) => [
    v.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''),
    k,
  ])
)

interface Props {
  state: string
  city: string
  onChange: (state: string, city: string) => void
  inputClass?: string
  labelClass?: string
}

export default function LocationPicker({ state, city, onChange, inputClass, labelClass }: Props) {
  const [cities, setCities] = useState<string[]>([])
  const [loadingCities, setLoadingCities] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [citySearch, setCitySearch] = useState(city)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const inputCls = inputClass ?? 'w-full bg-dark-700 border border-dark-400 rounded-xl px-3 py-2.5 text-sm text-dark-50 placeholder-dark-400 focus:outline-none focus:border-gold-500/40 transition-colors'
  const labelCls = labelClass ?? 'block text-sm font-medium text-dark-100 mb-1.5'

  useEffect(() => {
    setCitySearch(city)
  }, [city])

  useEffect(() => {
    if (!state) { setCities([]); setCitySearch(''); return }
    setLoadingCities(true)
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios?orderBy=nome`)
      .then(r => r.json())
      .then((data: { nome: string }[]) => {
        setCities(data.map(d => d.nome))
        setLoadingCities(false)
      })
      .catch(() => setLoadingCities(false))
  }, [state])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function useGPS() {
    if (!navigator.geolocation) return
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { 'Accept-Language': 'pt-BR' } }
          )
          const data = await res.json()
          const cityName: string = data.address?.city || data.address?.town || data.address?.village || ''
          const stateFull: string = data.address?.state || ''
          const normalized = stateFull.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
          const uf = NAME_TO_UF[normalized] || ''
          onChange(uf, cityName)
          setCitySearch(cityName)
        } catch {}
        setGpsLoading(false)
      },
      () => setGpsLoading(false),
      { timeout: 10000 }
    )
  }

  const filtered = cities.filter(c =>
    c.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(
      citySearch.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    )
  )

  return (
    <div className="space-y-3">
      {/* GPS button */}
      <button
        type="button"
        onClick={useGPS}
        disabled={gpsLoading}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gold-500/40 bg-gold-500/10 hover:bg-gold-500/15 text-gold-400 text-sm font-medium transition-colors disabled:opacity-60"
      >
        {gpsLoading
          ? <Loader2 size={15} className="animate-spin" />
          : <Navigation size={15} />
        }
        {gpsLoading ? 'Detectando localização...' : 'Usar minha localização (GPS)'}
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* State */}
        <div>
          <label className={labelCls}>Estado</label>
          <select
            value={state}
            onChange={e => { onChange(e.target.value, ''); setCitySearch('') }}
            className={inputCls}
          >
            <option value="">Selecione o estado</option>
            {Object.entries(STATE_NAMES).map(([uf, name]) => (
              <option key={uf} value={uf}>{uf} — {name}</option>
            ))}
          </select>
        </div>

        {/* City with search dropdown */}
        <div ref={dropdownRef} className="relative">
          <label className={labelCls}>Cidade</label>
          <div className="relative">
            <input
              type="text"
              value={citySearch}
              onChange={e => { setCitySearch(e.target.value); setShowDropdown(true) }}
              onFocus={() => { if (state) setShowDropdown(true) }}
              placeholder={!state ? 'Selecione o estado primeiro' : loadingCities ? 'Carregando...' : 'Digite para buscar'}
              disabled={!state || loadingCities}
              className={`${inputCls} pr-8`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-dark-400">
              {loadingCities
                ? <Loader2 size={13} className="animate-spin" />
                : <ChevronDown size={13} />
              }
            </span>
          </div>

          {showDropdown && filtered.length > 0 && (
            <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-dark-700 border border-dark-500 rounded-xl shadow-lg shadow-dark-400/20 max-h-52 overflow-y-auto">
              {filtered.slice(0, 80).map(c => (
                <button
                  key={c}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { onChange(state, c); setCitySearch(c); setShowDropdown(false) }}
                  className="w-full text-left px-3.5 py-2 text-sm text-dark-100 hover:bg-dark-700 hover:text-dark-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
