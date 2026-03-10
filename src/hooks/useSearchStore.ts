import { create } from 'zustand'
import { addMonths, format } from 'date-fns'
import type { SearchedCity } from '../types/airports.js'

function nextMonths(count: number): string[] {
  const today = new Date()
  return Array.from({ length: count }, (_, i) =>
    format(addMonths(today, i + 1), 'yyyy-MM')
  )
}

interface SearchState {
  origins: SearchedCity[]
  destinations: SearchedCity[]
  searchMonths: string[]
  tripNights: number
  hasSearched: boolean

  setOrigins: (cities: SearchedCity[]) => void
  setDestinations: (cities: SearchedCity[]) => void
  toggleMonth: (month: string) => void
  setTripNights: (nights: number) => void
  toggleOriginAirport: (cityId: string, airportCode: string) => void
  toggleDestAirport: (cityId: string, airportCode: string) => void
  markSearched: () => void
}

export const useSearchStore = create<SearchState>((set) => ({
  origins: [],
  destinations: [],
  searchMonths: nextMonths(3).slice(0, 2),
  tripNights: 4,
  hasSearched: false,

  setOrigins: (cities) => set({ origins: cities }),
  setDestinations: (cities) => set({ destinations: cities }),

  toggleMonth: (month) =>
    set((s) => ({
      searchMonths: s.searchMonths.includes(month)
        ? s.searchMonths.filter((m) => m !== month)
        : [...s.searchMonths, month].sort(),
    })),

  setTripNights: (tripNights) => set({ tripNights }),

  toggleOriginAirport: (cityId, airportCode) =>
    set((s) => ({
      origins: s.origins.map((c) =>
        c.id !== cityId
          ? c
          : {
              ...c,
              selectedAirports: c.selectedAirports.includes(airportCode)
                ? c.selectedAirports.filter((a) => a !== airportCode)
                : [...c.selectedAirports, airportCode],
            }
      ),
    })),

  toggleDestAirport: (cityId, airportCode) =>
    set((s) => ({
      destinations: s.destinations.map((c) =>
        c.id !== cityId
          ? c
          : {
              ...c,
              selectedAirports: c.selectedAirports.includes(airportCode)
                ? c.selectedAirports.filter((a) => a !== airportCode)
                : [...c.selectedAirports, airportCode],
            }
      ),
    })),

  markSearched: () => set({ hasSearched: true }),
}))

export function getSelectedOriginCodes(origins: SearchedCity[]): string[] {
  return origins.flatMap((c) => c.selectedAirports)
}

export function getSelectedDestCodes(destinations: SearchedCity[]): string[] {
  return destinations.flatMap((c) => c.selectedAirports)
}

export function getAvailableMonths(): string[] {
  return nextMonths(6)
}
