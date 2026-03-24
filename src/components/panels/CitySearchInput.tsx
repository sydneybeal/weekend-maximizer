import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, Loader2, MapPin } from 'lucide-react'
import { useAirportSearch } from '../../hooks/useAirportSearch.js'
import type { CityResult, SearchedCity } from '../../types/airports.js'
import { cn } from '../../lib/utils.js'

interface CitySearchInputProps {
  placeholder: string
  onCityResolved: (city: SearchedCity) => void
  existingCities: SearchedCity[]
  onRemoveCity: (id: string) => void
  maxCities?: number
}

let idCounter = 0
function makeId() {
  return `city-${++idCounter}`
}

export function CitySearchInput({
  placeholder,
  onCityResolved,
  existingCities,
  onRemoveCity,
  maxCities = 3,
}: CitySearchInputProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350)
    return () => clearTimeout(t)
  }, [query])

  const { data: results, isLoading } = useAirportSearch(debouncedQuery)

  const openDropdown = useCallback(() => {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    setOpen(true)
  }, [])

  useEffect(() => {
    if (results && results.length > 0 && debouncedQuery.length >= 2) {
      openDropdown()
    }
  }, [results, debouncedQuery, openDropdown])

  // Click outside to close
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = useCallback(
    (city: CityResult) => {
      if (existingCities.length >= maxCities) return
      const alreadyAdded = existingCities.some(
        (c) => c.resolved?.code === city.code
      )
      if (alreadyAdded) {
        setQuery('')
        setOpen(false)
        return
      }

      const newCity: SearchedCity = {
        id: makeId(),
        keyword: query,
        resolved: city,
        selectedAirports: city.airports.slice(0, 1).map((a) => a.code),
      }
      onCityResolved(newCity)
      setQuery('')
      setOpen(false)
    },
    [existingCities, maxCities, onCityResolved, query]
  )

  const dropdown = open && results && results.length > 0 && pos
    ? createPortal(
      <div
        ref={dropdownRef}
        style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
        className="glass rounded-xl overflow-hidden shadow-2xl shadow-black/50"
      >
        {results.map((city) => (
          <button
            key={city.code}
            onClick={() => handleSelect(city)}
            className="w-full px-3 py-2.5 flex items-start gap-2.5 hover:bg-white/5 transition-colors text-left group"
          >
            <MapPin className="w-4 h-4 text-electric-cyan mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">{city.name}</p>
              <p className="text-[11px] text-white/40">
                {city.airports.slice(0, 3).map((a) => a.code).join(', ')} · {city.country}
              </p>
            </div>
          </button>
        ))}
      </div>,
      document.body
    )
    : null

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        <input
          ref={inputRef}
          className="glass-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results && results.length > 0 && openDropdown()}
          disabled={existingCities.length >= maxCities}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 animate-spin" />
        )}
      </div>

      {dropdown}

      {existingCities.length >= maxCities && (
        <p className="text-[11px] text-white/30 mt-1.5">Max {maxCities} cities</p>
      )}
    </div>
  )
}

// ── Added cities with airport chip toggles ──────────────────────────────────

interface AddedCityProps {
  city: SearchedCity
  onRemove: (id: string) => void
  onToggleAirport: (cityId: string, code: string) => void
}

export function AddedCity({ city, onRemove, onToggleAirport }: AddedCityProps) {
  if (!city.resolved) return null

  return (
    <div className="glass rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">{city.resolved.name}</span>
        <button
          onClick={() => onRemove(city.id)}
          className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <X className="w-3 h-3 text-white/40" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {city.resolved.airports.map((airport) => {
          const selected = city.selectedAirports.includes(airport.code)
          return (
            <button
              key={airport.code}
              onClick={() => onToggleAirport(city.id, airport.code)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all',
                selected
                  ? 'bg-electric-blue/20 border border-electric-blue/40 text-electric-cyan'
                  : 'glass border border-transparent text-white/40 hover:text-white/60 hover:border-white/10'
              )}
              title={`${airport.name}${airport.distance ? ` · ${Math.round(airport.distance)} km` : ''}`}
            >
              {airport.code}
            </button>
          )
        })}
      </div>
    </div>
  )
}
