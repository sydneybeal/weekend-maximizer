import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { FlightOffer, DestinationResult } from '../types/flights.js'
import { scoreOffers } from '../lib/scoring.js'
import { airportCityMap } from '../lib/utils.js'

interface SearchPair {
  origin: string
  destination: string
}

interface SearchParams {
  pairs: SearchPair[]
  departureDate: string
  returnDate: string
  enabled: boolean
}

interface FlightSearchResponse {
  origin: string
  destination: string
  offers: FlightOffer[]
  error?: string
}

async function fetchFlights(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string
): Promise<FlightSearchResponse> {
  const res = await fetch('/api/flights/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin, destination, departureDate, returnDate }),
  })
  if (!res.ok) {
    return { origin, destination, offers: [], error: `HTTP ${res.status}` }
  }
  return res.json() as Promise<FlightSearchResponse>
}

export function useFlightSearch({ pairs, departureDate, returnDate, enabled }: SearchParams) {
  const queries = useQueries({
    queries: pairs.map(({ origin, destination }) => ({
      queryKey: ['flights', origin, destination, departureDate, returnDate],
      queryFn: () => fetchFlights(origin, destination, departureDate, returnDate),
      enabled,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
    })),
  })

  const totalSearches = pairs.length
  const completedSearches = queries.filter((q) => q.isSuccess || q.isError).length
  const isLoading = queries.some((q) => q.isFetching)
  const progress = totalSearches > 0 ? (completedSearches / totalSearches) * 100 : 0

  // Group all successful offers by destination
  const resultsByDestination = useMemo<DestinationResult[]>(() => {
    // Collect all offers
    const allOffers: FlightOffer[] = queries
      .filter((q) => q.isSuccess && q.data)
      .flatMap((q) => q.data!.offers)

    // Unique destinations from pairs
    const destCodes = [...new Set(pairs.map((p) => p.destination))]

    return destCodes.map((dest) => {
      const destOffers = allOffers.filter((o) => o.destination === dest)
      const scored = scoreOffers(destOffers)
      const bestOffer = scored.sort((a, b) => b.score - a.score)[0]

      // Check if all queries for this destination are done
      const destQueries = queries.filter((_, i) => pairs[i]?.destination === dest)
      const destLoading = destQueries.some((q) => q.isFetching || q.isPending)
      const destError = destQueries.every((q) => q.isError)
        ? 'No flights found'
        : undefined

      return {
        destination: dest,
        destinationCity: airportCityMap(dest),
        destinationCountry: '',
        offers: scored,
        bestOffer,
        isLoading: destLoading,
        error: destError,
      }
    })
  }, [queries, pairs])

  return { resultsByDestination, isLoading, progress, completedSearches, totalSearches }
}
