import { create } from 'zustand'
import type { SortKey, FilterKey, FlightOffer } from '../types/flights.js'

interface ResultsState {
  sortKey: SortKey
  filterKey: FilterKey
  drawerDestination: string | null   // IATA code of open drawer
  drawerOffers: FlightOffer[]

  setSortKey: (key: SortKey) => void
  setFilterKey: (key: FilterKey) => void
  openDrawer: (destination: string, offers: FlightOffer[]) => void
  closeDrawer: () => void
}

export const useResultsStore = create<ResultsState>((set) => ({
  sortKey: 'score',
  filterKey: 'all',
  drawerDestination: null,
  drawerOffers: [],

  setSortKey: (sortKey) => set({ sortKey }),
  setFilterKey: (filterKey) => set({ filterKey }),
  openDrawer: (destination, offers) => set({ drawerDestination: destination, drawerOffers: offers }),
  closeDrawer: () => set({ drawerDestination: null, drawerOffers: [] }),
}))
