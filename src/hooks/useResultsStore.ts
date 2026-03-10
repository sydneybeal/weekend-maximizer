import { create } from 'zustand'
import type { SortKey, FilterKey, FlightOffer } from '../types/flights.js'

// Airlines excluded by the "No Budget" filter
export const BUDGET_AIRLINE_CODES = new Set(['NK', 'F9', 'G4'])  // Spirit, Frontier, Allegiant

interface ResultsState {
  sortKey: SortKey
  filterKey: FilterKey
  excludeBudget: boolean
  drawerDestination: string | null
  drawerOffers: FlightOffer[]

  setSortKey: (key: SortKey) => void
  setFilterKey: (key: FilterKey) => void
  toggleExcludeBudget: () => void
  openDrawer: (destination: string, offers: FlightOffer[]) => void
  closeDrawer: () => void
}

export const useResultsStore = create<ResultsState>((set) => ({
  sortKey: 'score',
  filterKey: 'all',
  excludeBudget: false,
  drawerDestination: null,
  drawerOffers: [],

  setSortKey: (sortKey) => set({ sortKey }),
  setFilterKey: (filterKey) => set({ filterKey }),
  toggleExcludeBudget: () => set((s) => ({ excludeBudget: !s.excludeBudget })),
  openDrawer: (destination, offers) => set({ drawerDestination: destination, drawerOffers: offers }),
  closeDrawer: () => set({ drawerDestination: null, drawerOffers: [] }),
}))
