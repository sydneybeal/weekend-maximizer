import { create } from 'zustand'
import type { SearchedCity } from '../types/airports.js'
import { toYMD } from '../lib/utils.js'
import { addDays } from 'date-fns'

interface SearchState {
  origins: SearchedCity[]
  destinations: SearchedCity[]
  departureDate: string    // YYYY-MM-DD
  returnDate: string       // YYYY-MM-DD
  hasSearched: boolean

  setOrigins: (cities: SearchedCity[]) => void
  setDestinations: (cities: SearchedCity[]) => void
  setDates: (departure: string, returnDate: string) => void
  toggleOriginAirport: (cityId: string, airportCode: string) => void
  toggleDestAirport: (cityId: string, airportCode: string) => void
  markSearched: () => void
}

const today = new Date()
const defaultDepart = toYMD(addDays(today, 14))
const defaultReturn = toYMD(addDays(today, 17))

export const useSearchStore = create<SearchState>((set) => ({
  origins: [],
  destinations: [],
  departureDate: defaultDepart,
  returnDate: defaultReturn,
  hasSearched: false,

  setOrigins: (cities) => set({ origins: cities }),
  setDestinations: (cities) => set({ destinations: cities }),
  setDates: (departureDate, returnDate) => set({ departureDate, returnDate }),

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

// Derived selectors
export function getSelectedOriginCodes(origins: SearchedCity[]): string[] {
  return origins.flatMap((c) => c.selectedAirports)
}

export function getSelectedDestCodes(destinations: SearchedCity[]): string[] {
  return destinations.flatMap((c) => c.selectedAirports)
}
